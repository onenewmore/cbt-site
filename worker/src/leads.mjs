// Quote requests and the Pro waitlist. We store the request with the consent we showed, optionally forward it to a webhook
// (CRM / Zapier / n8n) and notify the site owner by email. We never sell or share leads without the consent text on the form.
import { json, err, readJson, clamp, normEmail, isEmail, clientIp, kvLimit, sha256Hex, randomHex, now, fetchWithTimeout, safeEqual } from './util.mjs';
import { sendMail } from './mail.mjs';
import { writeEvent } from './events.mjs';
import partners from './generated/partners.mjs';

export const LEAD_TTL_S = 180 * 86_400;
export const CATEGORIES = new Set([...Object.keys(partners.categories), 'pro-waitlist']);
export const CONSENT_VERSION = 'v1-2026-10';

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token), remoteip: ip });
    const r = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, timeout: 6000 });
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}

export async function handleLead(req, env, ctx) {
  let b;
  try { b = await readJson(req, 12 * 1024); } catch (e) { return err(e.status || 400, 'bad_request'); }
  // honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (b.website) return json({ ok: true });
  const ip = clientIp(req);
  const email = normEmail(b.email);
  const category = clamp(b.category, 40);
  if (!CATEGORIES.has(category)) return err(400, 'invalid_category');
  if (!isEmail(email)) return err(400, 'invalid_email');
  if (b.consent !== true) return err(400, 'consent_required');
  const name = clamp(b.name, 120);
  if (!name) return err(400, 'name_required');
  const rl = await kvLimit(env, 'lead-ip', ip, 6, 3600);
  if (!rl.ok) return err(429, 'rate_limited', undefined, { 'retry-after': String(rl.retryAfter) });
  if (!(await verifyTurnstile(env, b.turnstile, ip))) return err(400, 'captcha_failed');

  // same person + same category within 24h: acknowledge but do not create a second lead
  const dupKey = `leaddup:${await sha256Hex(email + '|' + category)}`;
  if (await env.CBT_KV.get(dupKey)) return json({ ok: true, duplicate: true });
  await env.CBT_KV.put(dupKey, '1', { expirationTtl: 86_400 });

  const ts = now();
  const id = `${ts.toString(36)}-${randomHex(4)}`;
  const lead = {
    id, ts: new Date(ts).toISOString(), category, src: clamp(b.src, 60), lang: b.lang === 'zh' ? 'zh' : 'en',
    name, email, company: clamp(b.company, 160), route: clamp(b.route, 200), cargo: clamp(b.cargo, 300), volume: clamp(b.volume, 120), details: clamp(b.details, 1500),
    consent: { version: CONSENT_VERSION, at: new Date(ts).toISOString() },
    // a salted hash lets us spot repeat abuse without keeping the raw IP address
    ipHash: (await sha256Hex(ip + '|' + (env.SESSION_SECRET || 'dev'))).slice(0, 16),
    country: (req.cf && req.cf.country) || '',
  };
  await env.CBT_KV.put(`lead:${ts.toString().padStart(14, '0')}:${id}`, JSON.stringify(lead), { expirationTtl: LEAD_TTL_S });

  const after = [];
  if (env.LEADS_WEBHOOK_URL) {
    after.push(fetchWithTimeout(env.LEADS_WEBHOOK_URL, { method: 'POST', timeout: 8000, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'lead', lead }) }).catch((e) => console.error('lead webhook failed', e && e.message)));
  }
  if (env.LEAD_NOTIFY_EMAIL) {
    after.push(sendMail(env, {
      to: env.LEAD_NOTIFY_EMAIL, replyTo: email,
      subject: `[lead] ${category} — ${name}${lead.company ? ' (' + lead.company + ')' : ''}`,
      text: ['category: ' + category, 'source: ' + lead.src, 'lang: ' + lead.lang, '', 'name: ' + name, 'email: ' + email, 'company: ' + lead.company, 'route: ' + lead.route, 'cargo: ' + lead.cargo, 'volume: ' + lead.volume, 'details: ' + lead.details, '', 'consent: ' + lead.consent.version + ' @ ' + lead.consent.at].join('\n'),
    }));
  }
  writeEvent(env, { name: 'lead_server', lang: lead.lang, type: 'lead', country: lead.country, cat: category, src: lead.src });
  const p = Promise.all(after);
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  return json({ ok: true, id });
}

// ---- owner-only export / deletion (Bearer ADMIN_TOKEN) ----
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export async function handleAdminLeads(req, env) {
  const h = req.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 8 || !safeEqual(h, `Bearer ${env.ADMIN_TOKEN}`)) return err(401, 'unauthorized');
  const url = new URL(req.url);
  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id') || '';
    const email = normEmail(url.searchParams.get('email'));
    let removed = 0;
    let cursor;
    do {
      const page = await env.CBT_KV.list({ prefix: 'lead:', cursor, limit: 1000 });
      for (const k of page.keys) {
        if (id && k.name.endsWith(':' + id)) { await env.CBT_KV.delete(k.name); removed++; continue; }
        if (email) { const v = JSON.parse((await env.CBT_KV.get(k.name)) || '{}'); if (v.email === email) { await env.CBT_KV.delete(k.name); removed++; } }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return json({ removed });
  }
  if (req.method !== 'GET') return err(405, 'method_not_allowed');
  const cat = url.searchParams.get('category') || '';
  const since = url.searchParams.get('since') || '';
  const limit = Math.min(2000, Number(url.searchParams.get('limit')) || 500);
  const out = [];
  let cursor;
  do {
    const page = await env.CBT_KV.list({ prefix: 'lead:', cursor, limit: 1000 });
    for (const k of page.keys) {
      if (out.length >= limit) break;
      const v = JSON.parse((await env.CBT_KV.get(k.name)) || 'null');
      if (!v) continue;
      if (cat && v.category !== cat) continue;
      if (since && v.ts < since) continue;
      out.push(v);
    }
    cursor = page.list_complete || out.length >= limit ? undefined : page.cursor;
  } while (cursor);
  if (url.searchParams.get('format') === 'csv') {
    const cols = ['ts', 'category', 'src', 'lang', 'name', 'email', 'company', 'route', 'cargo', 'volume', 'details', 'country', 'id'];
    const body = [cols.join(','), ...out.map((l) => cols.map((c) => csvCell(l[c])).join(','))].join('\n');
    return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store', 'content-disposition': 'attachment; filename="leads.csv"' } });
  }
  return json({ count: out.length, leads: out });
}
