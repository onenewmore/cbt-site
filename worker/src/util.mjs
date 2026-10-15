// Small shared helpers: responses, crypto, validation, rate limiting. Web-standard APIs only (runs on Workers and Node 20+).

const enc = new TextEncoder();
const dec = new TextDecoder();

export const now = () => Date.now();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
  });
}
export const err = (status, code, message, headers = {}) => json({ error: code, ...(message ? { message } : {}) }, status, headers);

export async function readJson(req, maxBytes = 16 * 1024) {
  const text = await req.text();
  if (text.length > maxBytes) throw Object.assign(new Error('payload too large'), { status: 413 });
  try { return text ? JSON.parse(text) : {}; } catch { throw Object.assign(new Error('invalid json'), { status: 400 }); }
}

// ---- base64url / hex ----
export function b64urlEncode(bytes) {
  let s = '';
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlDecode(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
export const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const randomHex = (nBytes = 16) => hex(crypto.getRandomValues(new Uint8Array(nBytes)));

export async function sha256Hex(str) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(str))); }

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function hmacHex(secret, message) {
  return hex(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(message)));
}
export async function hmacB64url(secret, message) {
  return b64urlEncode(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(message)));
}

// constant-time string comparison (both are hex / base64url, so length differences are not secret)
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---- signed tokens: base64url(payload).base64url(hmac) ----
export async function signToken(secret, payload) {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  return `${body}.${await hmacB64url(secret, body)}`;
}
export async function verifyToken(secret, token, type) {
  if (!secret || typeof token !== 'string') return null;
  const i = token.indexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!safeEqual(sig, await hmacB64url(secret, body))) return null;
  let p;
  try { p = JSON.parse(dec.decode(b64urlDecode(body))); } catch { return null; }
  if (!p || p.t !== type || typeof p.exp !== 'number' || p.exp * 1000 <= now()) return null;
  return p;
}

// ---- validation ----
export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const isEmail = (e) => typeof e === 'string' && e.length <= 200 && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]{2,}$/.test(e);
export const clamp = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
export const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function clientIp(req) {
  return req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '0.0.0.0';
}
export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);

// ---- rate limiting ----
// KV counters: good for low-volume sensitive endpoints (login, lead, API quota). KV is eventually consistent, so limits are approximate.
export async function kvCount(env, key, ttlSeconds, inc = true) {
  const raw = await env.CBT_KV.get(key);
  const n = (raw ? parseInt(raw, 10) : 0) || 0;
  if (inc) await env.CBT_KV.put(key, String(n + 1), { expirationTtl: Math.max(60, ttlSeconds) });
  return n + (inc ? 1 : 0);
}
export async function kvLimit(env, name, id, limit, windowSec) {
  const bucket = Math.floor(now() / 1000 / windowSec);
  const n = await kvCount(env, `rl:${name}:${id}:${bucket}`, windowSec * 2);
  return { ok: n <= limit, n, limit, retryAfter: windowSec - (Math.floor(now() / 1000) % windowSec) };
}
// In-isolate counters: free and fast, best-effort per isolate. Use for high-volume public endpoints (events, proxy).
const mem = new Map();
export function memLimit(name, id, limit, windowMs = 60_000) {
  const t = now();
  const k = name + ':' + id;
  let e = mem.get(k);
  if (!e || t - e.t > windowMs) { e = { t, n: 0 }; mem.set(k, e); }
  e.n += 1;
  if (mem.size > 5000) for (const [kk, v] of mem) if (t - v.t > windowMs) mem.delete(kk);
  return e.n <= limit;
}

// ---- upstream fetch with timeout ----
export async function fetchWithTimeout(url, { timeout = 10_000, ...init } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(id); }
}

export const userAgent = (env) => `CBT-Toolkit/1.0 (+${env.SITE_URL || 'https://example.com'}${env.CONTACT_EMAIL ? '; ' + env.CONTACT_EMAIL : ''})`;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
