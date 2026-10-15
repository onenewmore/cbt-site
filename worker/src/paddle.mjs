// Paddle Billing (merchant of record) integration: webhook receiver + customer portal.
// NOTE: written from Paddle's public API shape without live verification. Check every field against the current docs in the
// SANDBOX before going live (see docs/LAUNCH.md, "Verify before launch").
import { json, err, hmacHex, safeEqual, now, fetchWithTimeout, normEmail, isEmail } from './util.mjs';
import { SUB_EVENTS, getSub, subKey, recordFromSubscription, getPass, passKey, extendPass } from './entitlement.mjs';
import { sendLoginEmail } from './auth.mjs';
import siteConfig from './generated/site-config.mjs';

const apiBase = (env) => (env.PADDLE_ENV === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com');
export const SIGNATURE_TOLERANCE_S = 300;

// Header: "ts=1671552777;h1=<hex>" (h1 may repeat while a secret is being rotated). Signed payload: `${ts}:${rawBody}`.
export async function verifyPaddleSignature(secret, header, rawBody, nowMs = now()) {
  if (!secret || !header) return false;
  const parts = String(header).split(';').map((s) => s.trim());
  const ts = (parts.find((p) => p.startsWith('ts=')) || '').slice(3);
  const sigs = parts.filter((p) => p.startsWith('h1=')).map((p) => p.slice(3));
  if (!/^\d+$/.test(ts) || !sigs.length) return false;
  if (Math.abs(nowMs / 1000 - Number(ts)) > SIGNATURE_TOLERANCE_S) return false;
  const expected = await hmacHex(secret, `${ts}:${rawBody}`);
  return sigs.some((s) => safeEqual(s, expected));
}

async function paddleApi(env, path, init = {}) {
  if (!env.PADDLE_API_KEY) throw Object.assign(new Error('PADDLE_API_KEY missing'), { code: 'not_configured' });
  const res = await fetchWithTimeout(apiBase(env) + path, {
    ...init, timeout: 10_000,
    headers: { authorization: 'Bearer ' + env.PADDLE_API_KEY, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error('paddle ' + res.status), { status: res.status, body });
  return body;
}

export async function emailForCustomer(env, customerId) {
  if (!customerId) return null;
  const cached = await env.CBT_KV.get(`cust:${customerId}`);
  if (cached) return cached;
  const r = await paddleApi(env, `/customers/${encodeURIComponent(customerId)}`);
  const email = normEmail(r && r.data && r.data.email);
  if (!isEmail(email)) return null;
  await env.CBT_KV.put(`cust:${customerId}`, email, { expirationTtl: 30 * 86_400 });
  return email;
}

// POST /api/paddle/webhook
export async function handleWebhook(req, env, ctx) {
  if (!env.PADDLE_WEBHOOK_SECRET) return err(503, 'not_configured');
  const raw = await req.text();
  const ok = await verifyPaddleSignature(env.PADDLE_WEBHOOK_SECRET, req.headers.get('paddle-signature'), raw);
  if (!ok) return err(400, 'bad_signature');
  let ev;
  try { ev = JSON.parse(raw); } catch { return err(400, 'bad_json'); }
  const type = String(ev.event_type || '');
  const id = String(ev.event_id || '');
  if (!id) return err(400, 'no_event_id');
  if (await env.CBT_KV.get(`evt:${id}`)) return json({ ok: true, duplicate: true });
  if (type === 'transaction.completed' && ev.data) return handlePassTransaction(env, ctx, ev, id);
  if (!SUB_EVENTS.has(type) || !ev.data) { await env.CBT_KV.put(`evt:${id}`, '1', { expirationTtl: 30 * 86_400 }); return json({ ok: true, ignored: type }); }

  const data = ev.data;
  let email;
  try { email = await emailForCustomer(env, data.customer_id); } catch (e) {
    // transient or config problem: a non-2xx makes Paddle retry later
    console.error('customer lookup failed', e && e.message);
    return err(500, 'customer_lookup_failed');
  }
  if (!email) return err(500, 'no_email');

  const prev = await getSub(env, email);
  const eventAt = Date.parse(ev.occurred_at || '') || now();
  if (prev && prev.lastEventAt && eventAt < prev.lastEventAt) {
    await env.CBT_KV.put(`evt:${id}`, '1', { expirationTtl: 30 * 86_400 });
    return json({ ok: true, stale: true });
  }
  const rec = recordFromSubscription(data, prev, eventAt);
  rec.email = email;
  await env.CBT_KV.put(subKey(email), JSON.stringify(rec));
  await env.CBT_KV.put(`evt:${id}`, '1', { expirationTtl: 30 * 86_400 });

  const first = !prev && (rec.status === 'active' || rec.status === 'trialing');
  if (first) {
    const lang = data.custom_data && data.custom_data.lang === 'zh' ? 'zh' : 'en';
    const p = sendLoginEmail(env, email, lang, { welcome: true });
    if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  }
  return json({ ok: true, status: rec.status });
}

// One-time pass: transaction.completed for the configured one-time price (no subscription attached).
// Field names follow Paddle Billing's transaction entity (id, status, customer_id, subscription_id, items[].price.id).
// NOT verified against a live sandbox yet - check before switching PADDLE_ENV to production.
export function passPriceIn(data, priceId) {
  if (!priceId || !data || data.subscription_id) return false;
  return Array.isArray(data.items) && data.items.some((it) => (it.price && it.price.id === priceId) || it.price_id === priceId);
}

async function handlePassTransaction(env, ctx, ev, id) {
  const data = ev.data;
  const done = async (extra) => { await env.CBT_KV.put(`evt:${id}`, '1', { expirationTtl: 30 * 86_400 }); return json({ ok: true, ...extra }); };
  if (!passPriceIn(data, env.PADDLE_PRICE_PASS || siteConfig.passPriceId)) return done({ ignored: 'transaction.completed' });
  const txnId = String(data.id || '');
  if (!txnId) return err(400, 'no_transaction_id');
  let email;
  try { email = await emailForCustomer(env, data.customer_id); } catch (e) {
    console.error('customer lookup failed', e && e.message);
    return err(500, 'customer_lookup_failed');
  }
  if (!email) return err(500, 'no_email');
  const prev = await getPass(env, email);
  if (prev && Array.isArray(prev.txns) && prev.txns.includes(txnId)) return done({ duplicate: true });
  const pass = extendPass(prev, txnId);
  pass.customerId = data.customer_id || (prev && prev.customerId) || null;
  await env.CBT_KV.put(passKey(email), JSON.stringify(pass));
  if (!prev && !(await getSub(env, email))) {
    const lang = data.custom_data && data.custom_data.lang === 'zh' ? 'zh' : 'en';
    const p = sendLoginEmail(env, email, lang, { welcome: true });
    if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  }
  return done({ pass: true, periodEnd: pass.periodEnd });
}

// Creates a customer-portal session so the user can update the card, view invoices and cancel on Paddle's hosted pages.
export async function createPortalUrl(env, email) {
  const sub = (await getSub(env, email)) || (await getPass(env, email));
  if (!sub || !sub.customerId) return null;
  const body = sub.subscriptionId ? { subscription_ids: [sub.subscriptionId] } : {};
  const r = await paddleApi(env, `/customers/${encodeURIComponent(sub.customerId)}/portal-sessions`, { method: 'POST', body: JSON.stringify(body) });
  const urls = r && r.data && r.data.urls;
  return (urls && urls.general && urls.general.overview) || null;
}
