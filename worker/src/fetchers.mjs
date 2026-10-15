// Cached access to third-party data providers (HTS, FX). Uses the Workers Cache API when present; plain fetch otherwise (Node tests).
import { fetchWithTimeout, userAgent } from './util.mjs';
import { parseErApi, parseFawaz, parseFrankfurter } from './generated/js/calc.js';

export const UPSTREAMS = {
  hts: { origin: 'https://hts.usitc.gov', ok: (p) => p === '/reststop/search', ttl: 6 * 3600 },
  zip: { origin: 'https://api.zippopotam.us', ok: (p) => /^\/[a-z]{2}\/[A-Za-z0-9%._-]{1,40}$/.test(p), ttl: 7 * 86400 },
  osm: { origin: 'https://nominatim.openstreetmap.org', ok: (p) => p === '/search', ttl: 7 * 86400 },
  er: { origin: 'https://open.er-api.com', ok: (p) => /^\/v6\/latest\/[A-Z]{3}$/.test(p), ttl: 3600 },
  cdn: { origin: 'https://cdn.jsdelivr.net', ok: (p) => p === '/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json', ttl: 3600 },
  fx: { origin: 'https://api.frankfurter.dev', ok: (p) => p === '/v1/latest', ttl: 3600 },
};

const hasCache = () => typeof caches !== 'undefined' && caches.default;

// Returns { status, body(text), contentType, hit }.
export async function cachedGet(env, url, ttl) {
  const key = new Request(url, { method: 'GET' });
  if (hasCache()) {
    const m = await caches.default.match(key);
    if (m) return { status: m.status, body: await m.text(), contentType: m.headers.get('content-type') || 'application/json', hit: true };
  }
  const res = await fetchWithTimeout(url, { timeout: 12_000, headers: { 'user-agent': userAgent(env), accept: 'application/json' } });
  const body = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';
  if (res.status === 200 && hasCache()) {
    await caches.default.put(key, new Response(body, { status: 200, headers: { 'content-type': contentType, 'cache-control': `public, max-age=${ttl}` } }));
  }
  return { status: res.status, body, contentType, hit: false };
}

export async function htsSearch(env, keyword) {
  const u = UPSTREAMS.hts;
  const r = await cachedGet(env, `${u.origin}/reststop/search?keyword=${encodeURIComponent(keyword)}`, u.ttl);
  if (r.status !== 200) throw Object.assign(new Error('hts ' + r.status), { status: r.status });
  const data = JSON.parse(r.body);
  return Array.isArray(data) ? data : (data && data.results) || [];
}

const isoCurrencies = () => { try { return new Set(Intl.supportedValuesOf('currency')); } catch { return null; } };

const FX_PROVIDERS = {
  er: { url: 'https://open.er-api.com/v6/latest/USD', parse: parseErApi, attribution: 'Rates by Exchange Rate API (https://www.exchangerate-api.com)' },
  fx: { url: 'https://api.frankfurter.dev/v1/latest?base=USD', parse: parseFrankfurter, attribution: 'Reference rates published by the European Central Bank, via Frankfurter' },
  cdn: { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json', parse: parseFawaz, attribution: 'currency-api (jsDelivr)' },
};

// Tries providers in order (env.FX_SOURCES, default "er,fx,cdn") and returns the first normalised snapshot.
export async function loadRates(env) {
  const order = String(env.FX_SOURCES || 'er,fx,cdn').split(',').map((s) => s.trim()).filter((s) => FX_PROVIDERS[s]);
  const allow = isoCurrencies();
  let lastErr;
  for (const k of order) {
    try {
      const p = FX_PROVIDERS[k];
      const r = await cachedGet(env, p.url, 3600);
      if (r.status !== 200) throw new Error('HTTP ' + r.status);
      const data = p.parse(JSON.parse(r.body), allow);
      if (data && Object.keys(data.rates).length > 5) return { ...data, attribution: p.attribution };
    } catch (e) { lastErr = e; }
  }
  throw Object.assign(new Error('no FX provider available' + (lastErr ? ': ' + lastErr.message : '')), { status: 502 });
}
