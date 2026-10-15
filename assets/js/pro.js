// Pro session handling (stateless signed token issued by the Worker, kept in localStorage).
import { cfg } from './track.js';

const SKEY = 'cbt_session';
const PKEY = 'cbt_plan';

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SKEY));
    if (s && s.token && s.exp * 1000 > Date.now()) return s;
  } catch { /* ignore */ }
  return null;
}
export function setSession(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch { /* ignore */ } }
export function clearSession() { try { localStorage.removeItem(SKEY); localStorage.removeItem(PKEY); } catch { /* ignore */ } }

export function cachedPlan() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY));
    if (p && p.until > Date.now() && getSession()) return p.plan;
  } catch { /* ignore */ }
  return 'free';
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth) {
    const s = getSession();
    if (s) headers.authorization = 'Bearer ' + s.token;
  }
  const res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch { /* not json */ }
  if (res.status === 401 && auth) clearSession();
  return { ok: res.ok, status: res.status, data };
}

let inflight = null;
export function me(force = false) {
  if (!getSession()) return Promise.resolve({ plan: 'free', signedIn: false });
  if (inflight && !force) return inflight;
  inflight = api('/api/pro/me').then((r) => {
    inflight = null;
    if (!r.ok || !r.data) return { plan: 'free', signedIn: false };
    const m = { ...r.data, signedIn: true };
    try { localStorage.setItem(PKEY, JSON.stringify({ plan: m.plan, until: Date.now() + 10 * 60 * 1000 })); } catch { /* ignore */ }
    return m;
  }).catch(() => { inflight = null; return { plan: cachedPlan(), signedIn: true, offline: true }; });
  return inflight;
}

export const isProCached = () => cachedPlan() === 'pro';
export const pricingUrl = () => (cfg.lang === 'zh' ? '/zh/pricing/' : '/pricing/');
export const accountUrl = () => (cfg.lang === 'zh' ? '/zh/account/' : '/account/');
