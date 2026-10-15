// Pro entitlement derived from Paddle subscription events. One KV record per customer email: sub:<email>.
// The record is written only by the webhook handler (and only moves forward in time), so other writers cannot clobber it.
import { now } from './util.mjs';

export const GRACE_MS = 7 * 86_400_000; // keep access for 7 days while Paddle retries a failed renewal (status past_due)

export const subKey = (email) => `sub:${email}`;

export async function getSub(env, email) {
  const raw = await env.CBT_KV.get(subKey(email));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// pure function so it can be unit-tested
export function isActive(rec, t = now()) {
  if (!rec) return false;
  switch (rec.status) {
    case 'active':
    case 'trialing': return true;
    case 'past_due': return !!rec.periodEnd && t < rec.periodEnd + GRACE_MS;
    case 'canceled':
    case 'paused': return !!rec.periodEnd && rec.periodEnd > t; // the paid period is honoured if Paddle reported one
    default: return false;
  }
}

// ---- one-time "Lifetime Pro" purchase. Paddle offers WeChat Pay only for one-time items, so this is also how
// customers paying with WeChat Pay get Pro. Stored separately so subscription events never overwrite it.
export const passKey = (email) => `pass:${email}`;
export async function getPass(env, email) {
  const raw = await env.CBT_KV.get(passKey(email));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export const passActive = (pass) => !!(pass && pass.lifetime && !pass.revoked);
export function grantLifetime(prev, txnId, t = now()) {
  return { lifetime: true, txns: [...((prev && prev.txns) || []).slice(-19), txnId], grantedAt: (prev && prev.grantedAt) || t, updatedAt: t };
}

// true if the email has Pro through either a subscription or a pass
export async function hasPro(env, email, t = now()) {
  if (isActive(await getSub(env, email), t)) return true;
  return passActive(await getPass(env, email));
}

export async function getEntitlement(env, email) {
  const rec = await getSub(env, email);
  const subOn = isActive(rec);
  const pass = await getPass(env, email);
  const passOn = passActive(pass);
  const active = subOn || passOn;
  const usePass = !subOn && passOn;
  return {
    plan: active ? 'pro' : 'free',
    status: usePass ? 'active' : rec ? rec.status : 'none',
    interval: usePass ? 'lifetime' : rec ? rec.interval : null,
    periodEnd: usePass ? null : rec ? rec.periodEnd || null : null,
    cancelAtPeriodEnd: usePass ? false : !!(rec && rec.cancelAtPeriodEnd),
    customerId: rec ? rec.customerId : null,
    subscriptionId: rec ? rec.subscriptionId : null,
  };
}

const ms = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? t : null; };

// Map a Paddle subscription entity (webhook `data`) to our record. Field names follow Paddle Billing's subscription entity:
// status, customer_id, id, current_billing_period.{starts_at,ends_at}, scheduled_change.{action,effective_at}, billing_cycle.interval, items[].price.
export function recordFromSubscription(data, prev, eventAt) {
  const status = String(data.status || '').toLowerCase();
  const cp = data.current_billing_period || null;
  const sc = data.scheduled_change || null;
  const item = Array.isArray(data.items) && data.items[0] ? data.items[0] : null;
  const interval = (data.billing_cycle && data.billing_cycle.interval) || (item && item.price && item.price.billing_cycle && item.price.billing_cycle.interval) || (prev && prev.interval) || null;
  let periodEnd = cp && cp.ends_at ? ms(cp.ends_at) : null;
  if (periodEnd === null && (status === 'active' || status === 'trialing' || status === 'past_due') && prev) periodEnd = prev.periodEnd || null;
  return {
    email: prev ? prev.email : undefined,
    customerId: data.customer_id || (prev && prev.customerId) || null,
    subscriptionId: data.id || (prev && prev.subscriptionId) || null,
    status,
    interval,
    priceId: (item && item.price && item.price.id) || (item && item.price_id) || (prev && prev.priceId) || null,
    periodEnd,
    cancelAtPeriodEnd: !!(sc && sc.action === 'cancel'),
    lastEventAt: eventAt,
    createdAt: (prev && prev.createdAt) || now(),
    updatedAt: now(),
  };
}

// Events we act on. Anything else is acknowledged and ignored.
export const SUB_EVENTS = new Set([
  'subscription.created', 'subscription.activated', 'subscription.updated', 'subscription.canceled',
  'subscription.past_due', 'subscription.paused', 'subscription.resumed', 'subscription.trialing',
]);
