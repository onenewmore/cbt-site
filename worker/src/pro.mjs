// Signed-in Pro endpoints: /api/pro/me, /apikey, /watch, /portal. Auth = Bearer session token (not cookies, so no CSRF surface).
import { json, err, readJson, now } from './util.mjs';
import { sessionEmail } from './auth.mjs';
import { getEntitlement } from './entitlement.mjs';
import { issueApiKey } from './api.mjs';
import { createPortalUrl } from './paddle.mjs';
import { formatHts } from './generated/js/calc.js';
import policy from './generated/policy-updates.mjs';
import siteConfig from './generated/site-config.mjs';

export const prefsKey = (email) => `prefs:${email}`;
const maxCodes = (env) => Number(env.WATCH_MAX_CODES) || siteConfig.pro.watchlistCodes;

export async function getPrefs(env, email) {
  const raw = await env.CBT_KV.get(prefsKey(email));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function requirePro(req, env) {
  const email = await sessionEmail(req, env);
  if (!email) return { res: err(401, 'unauthorized') };
  const ent = await getEntitlement(env, email);
  return { email, ent };
}

export async function handleMe(req, env) {
  const email = await sessionEmail(req, env);
  if (!email) return err(401, 'unauthorized');
  const ent = await getEntitlement(env, email);
  return json({ email, plan: ent.plan, status: ent.status, interval: ent.interval, periodEnd: ent.periodEnd, cancelAtPeriodEnd: ent.cancelAtPeriodEnd });
}

export async function handleApiKey(req, env) {
  const a = await requirePro(req, env);
  if (a.res) return a.res;
  if (a.ent.plan !== 'pro') return err(403, 'pro_required');
  return json({ apiKey: await issueApiKey(env, a.email) });
}

export async function handlePortal(req, env) {
  const a = await requirePro(req, env);
  if (a.res) return a.res;
  try {
    const url = await createPortalUrl(env, a.email);
    return url ? json({ url }) : err(404, 'no_subscription');
  } catch (e) {
    console.error('portal error', e && e.message);
    return err(e && e.code === 'not_configured' ? 503 : 502, 'portal_unavailable');
  }
}

// GET/PUT /api/pro/watch  {codes:[], digest:boolean}
export async function handleWatch(req, env) {
  const a = await requirePro(req, env);
  if (a.res) return a.res;
  if (a.ent.plan !== 'pro') return err(403, 'pro_required');
  const cur = (await getPrefs(env, a.email)) || { codes: [], digest: true, seen: policy.updates.map((u) => u.id), createdAt: now() };
  if (req.method === 'GET') return json({ codes: cur.codes, digest: !!cur.digest, limit: maxCodes(env) });
  if (req.method !== 'PUT') return err(405, 'method_not_allowed');
  let body;
  try { body = await readJson(req, 4096); } catch (e) { return err(e.status || 400, 'bad_request'); }
  const codes = [];
  for (const c of Array.isArray(body.codes) ? body.codes : []) {
    const d = String(c).replace(/\D/g, '');
    if (d.length < 6 || d.length > 10) continue;
    const f = formatHts(d);
    if (!codes.includes(f)) codes.push(f);
  }
  const limited = codes.length > maxCodes(env);
  const next = { ...cur, codes: codes.slice(0, maxCodes(env)), digest: !!body.digest, updatedAt: now() };
  await env.CBT_KV.put(prefsKey(a.email), JSON.stringify(next));
  return json({ codes: next.codes, digest: next.digest, limit: maxCodes(env), limited });
}
