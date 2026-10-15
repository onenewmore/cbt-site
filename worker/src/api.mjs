// Pro REST API (/api/v1/*) + API-key management. Reuses the same pure calculation code as the browser tools (generated/js/calc.js).
import { json, err, randomHex, sha256Hex, kvLimit, kvCount, monthKey, now } from './util.mjs';
import { getEntitlement } from './entitlement.mjs';
import { htsSearch, loadRates } from './fetchers.mjs';
import {
  volumetricWeight, roundUpHalf, round2, parseDuty, parseChapter99Add, formatHts, extract99Refs, pickHtsItem, newSection301,
  euLandedCost, searchHsCommon, formatHs6, crossRate,
} from './generated/js/calc.js';
import { HS_COMMON } from './generated/js/data/hsdata.js';
import { US_RULES, EU_VAT, EU_VAT_ASOF, EU_LOW_VALUE } from './generated/js/data/rules.js';
import siteConfig from './generated/site-config.mjs';

const limits = (env) => ({
  month: Number(env.API_MONTHLY_CALLS) || siteConfig.pro.apiMonthlyCalls,
  minute: Number(env.API_PER_MINUTE) || siteConfig.pro.apiPerMinute,
});

// ---------- API keys ----------
export const KEY_PREFIX = 'cbt_live_';

// Creates (or rotates) the user's key. The plaintext is returned once; only its SHA-256 is stored.
export async function issueApiKey(env, email) {
  const old = await env.CBT_KV.get(`keyof:${email}`);
  if (old) await env.CBT_KV.delete(`apikey:${old}`);
  const key = KEY_PREFIX + randomHex(24);
  const h = await sha256Hex(key);
  await env.CBT_KV.put(`apikey:${h}`, JSON.stringify({ email, createdAt: now() }));
  await env.CBT_KV.put(`keyof:${email}`, h);
  return key;
}

async function authenticate(req, env) {
  const h = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  const key = m ? m[1] : req.headers.get('x-api-key') || '';
  if (!key.startsWith(KEY_PREFIX) || key.length > 80) return { res: err(401, 'invalid_api_key', 'Send your key as "Authorization: Bearer cbt_live_…".', { 'www-authenticate': 'Bearer' }) };
  const rec = await env.CBT_KV.get(`apikey:${await sha256Hex(key)}`);
  if (!rec) return { res: err(401, 'invalid_api_key', undefined, { 'www-authenticate': 'Bearer' }) };
  const { email } = JSON.parse(rec);
  const ent = await getEntitlement(env, email);
  if (ent.plan !== 'pro') return { res: err(403, 'plan_inactive', 'The Pro plan for this key is not active.') };
  return { email };
}

// ---------- handlers ----------
const num = (v) => { if (v === null || v === undefined || v === '') return NaN; const n = Number(String(v).replace(/,/g, '')); return Number.isFinite(n) ? n : NaN; };
const bad = (msg) => Object.assign(new Error(msg), { status: 400, code: 'invalid_parameter' });
const pos = (q, name, { req = true, max = 1e7, def } = {}) => {
  const raw = q.get(name);
  if (raw === null || raw === '') { if (def !== undefined) return def; if (req) throw bad(`Missing parameter: ${name}`); return null; }
  const n = num(raw);
  if (!(n > 0) || n > max) throw bad(`Invalid ${name}: expected a positive number up to ${max}`);
  return n;
};
const truthy = (v) => /^(1|true|yes)$/i.test(String(v || ''));
const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

function volumetric(q) {
  const l = pos(q, 'l', { max: 10000 }); const w = pos(q, 'w', { max: 10000 }); const h = pos(q, 'h', { max: 10000 });
  const divisor = pos(q, 'divisor', { def: 5000, max: 1e6 });
  const qty = Math.floor(pos(q, 'qty', { def: 1, max: 100000 }));
  const actual = pos(q, 'actual', { req: false, max: 1e6 });
  const vw = volumetricWeight(l, w, h, divisor, qty);
  const actualTotal = actual ? actual * qty : 0;
  const billable = Math.max(vw, actualTotal);
  const half = truthy(q.get('roundHalf'));
  return { volumetricKg: round2(vw), actualKg: actual ? round2(actualTotal) : null, chargeableKg: half ? roundUpHalf(billable) : round2(billable), divisor, qty, basis: actualTotal > vw ? 'actual' : 'volumetric' };
}

async function rates(env, q) {
  const base = String(q.get('base') || 'USD').toUpperCase();
  const data = await loadRates(env);
  if (!data.rates[base]) throw bad(`Unsupported base currency: ${base}`);
  const wanted = q.get('symbols') ? String(q.get('symbols')).toUpperCase().split(',').map((s) => s.trim()).filter(Boolean) : Object.keys(data.rates).filter((c) => c !== base);
  const unknown = wanted.filter((s) => !data.rates[s]);
  if (unknown.length) throw bad(`Unsupported currency: ${unknown.join(',')}`);
  const out = {};
  for (const s of wanted.slice(0, 200)) out[s] = Number(crossRate(base, s, data.rates).toPrecision(8));
  const res = { base, date: data.date, rates: out, source: data.source, attribution: data.attribution };
  const amount = num(q.get('amount'));
  if (Number.isFinite(amount)) {
    res.amount = amount;
    res.converted = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Number((amount * v).toFixed(4))]));
  }
  return res;
}

function hsSearch(q) {
  const term = String(q.get('q') || '').trim();
  if (term.length < 2) throw bad('Parameter q must be at least 2 characters');
  const limit = Math.min(30, Math.max(1, Math.floor(num(q.get('limit')) || 10)));
  const results = searchHsCommon(term.slice(0, 80), HS_COMMON, limit).map((e) => {
    // entry[4] is "中文说明||English note" (or a single Chinese note)
    const raw = String(e[4] || '');
    const [noteZh, noteEn] = raw.includes('||') ? raw.split('||') : [raw, ''];
    return { hs6: e[0], code: formatHs6(e[0]), zh: e[1], en: e[2], note: noteEn, noteZh };
  });
  return { query: term, hsVersion: 'HS 2022', results };
}

async function usTariff(env, q) {
  const digits = String(q.get('hts') || '').replace(/\D/g, '');
  if (digits.length < 6) throw bad('Parameter hts must have at least 6 digits');
  const code10 = digits.slice(0, 10);
  const origin = String(q.get('origin') || 'CN').toUpperCase();
  if (!/^[A-Z]{2}$/.test(origin)) throw bad('Parameter origin must be an ISO alpha-2 code');
  const value = num(q.get('value'));
  const kw = code10.length >= 8 ? formatHts(code10.slice(0, 8)) : formatHts(code10);
  const picked = pickHtsItem(await htsSearch(env, kw), code10);
  if (!picked.item) {
    if (picked.list.length) {
      throw Object.assign(new Error('The code matches several tariff lines; pass a longer code'), {
        status: 422, code: 'ambiguous_code', extra: { candidates: picked.list.slice(0, 40).map((r) => ({ hts: r.htsno, description: stripTags(r.description), general: r.general || '' })) },
      });
    }
    throw Object.assign(new Error('HTS code not found'), { status: 404, code: 'not_found' });
  }
  const item = picked.item;
  const nonNtr = US_RULES.nonNtr.includes(origin);
  const base = parseDuty(nonNtr ? (item.other || item.general) : item.general);
  const refs = [...new Set([item, ...picked.ancestors].flatMap(extract99Refs))];
  const s301Refs = refs.filter((r) => /^9903\.(88|91)\./.test(r));
  const s232Refs = refs.filter((r) => /^9903\.(7[89]|8[0-5]|94)\./.test(r));
  const otherRefs = refs.filter((r) => !s301Refs.includes(r));
  let legacy = 0;
  if (origin === 'CN' && s301Refs.length) {
    const adds = await Promise.all(s301Refs.slice(0, 8).map(async (ref) => {
      try {
        const hit = (await htsSearch(env, ref)).find((x) => String(x.htsno || '').replace(/\D/g, '') === ref.replace(/\D/g, ''));
        return hit ? parseChapter99Add(hit.general) : null;
      } catch { return null; }
    }));
    const found = adds.filter((a) => a !== null && a > 0);
    legacy = found.length ? Math.max(...found) : 0;
  }
  const auto = newSection301(origin, base.pct, US_RULES);
  const total = (base.pct ?? 0) + legacy + (auto.rate ?? 0);
  const notes = ['Ad-valorem estimate only; AD/CVD, Section 232 and other duties are separate.', 'The new Section 301 has many exemptions; check the official annexes.'];
  if (base.specific) notes.push('Includes a specific (per-unit) duty that is not in totalPct.');
  if (auto.rate === null) notes.push('Origin is not in the built-in list; new301Pct is unknown and not included in totalPct.');
  if (s232Refs.length) notes.push(`Linked to Section 232 provisions (${s232Refs.join(', ')}); the new 301 normally does not stack.`);
  return {
    hts: item.htsno, description: stripTags(item.description), origin,
    baseRatePct: base.pct, baseRateText: base.text, hasSpecificDuty: base.specific,
    legacy301Pct: legacy, new301Pct: auto.rate, new301Basis: auto.basis, totalPct: Number(total.toFixed(4)),
    estimatedDuty: Number.isFinite(value) && value > 0 ? round2((value * total) / 100) : null,
    otherChapter99: otherRefs.slice(0, 12), section232Refs: s232Refs, asOf: US_RULES.asOf, notes,
  };
}

function euCost(q) {
  const country = String(q.get('country') || '').toUpperCase();
  const vatOverride = num(q.get('vatPct'));
  const vatPct = Number.isFinite(vatOverride) ? vatOverride : EU_VAT[country];
  if (vatPct === undefined) throw bad('Parameter country must be an EU member state alpha-2 code (or pass vatPct)');
  const goods = pos(q, 'goods', { max: 1e9 });
  const shipping = q.get('shipping') ? num(q.get('shipping')) : 0;
  const dutyPct = q.get('dutyPct') ? num(q.get('dutyPct')) : 0;
  if (!(shipping >= 0) || !(dutyPct >= 0) || dutyPct > 100) throw bad('shipping and dutyPct must be non-negative (dutyPct ≤ 100)');
  const lowValue = truthy(q.get('lowValue'));
  const lines = Math.max(1, Math.floor(num(q.get('lines')) || 1));
  const r = euLandedCost({ goods, shipping, dutyPct, vatPct, lowValue, lines, flatEur: EU_LOW_VALUE.flatEur, threshold: EU_LOW_VALUE.thresholdEur });
  return {
    country, vatPct, customsValue: round2(r.customsValue), duty: round2(r.duty), vat: round2(r.vat), landedCost: round2(r.total), lowValueFlatDutyApplied: r.flat,
    vatAsOf: EU_VAT_ASOF, notes: ['Reference estimate in the currency of the amounts you passed. Confirm duty rate and VAT with TARIC / your customs broker.'],
  };
}

// ---------- router ----------
export async function handleV1(req, env) {
  if (req.method !== 'GET') return err(405, 'method_not_allowed');
  const auth = await authenticate(req, env);
  if (auth.res) return auth.res;
  const { email } = auth;
  const lim = limits(env);
  const mk = monthKey();
  const usedRaw = await env.CBT_KV.get(`quota:${email}:${mk}`);
  const used = parseInt(usedRaw || '0', 10) || 0;
  const perMin = await kvLimit(env, 'api', email, lim.minute, 60);
  const baseHeaders = {
    'x-ratelimit-limit-month': String(lim.month),
    'x-ratelimit-remaining-minute': String(Math.max(0, lim.minute - perMin.n)),
  };
  if (!perMin.ok) return err(429, 'rate_limited', 'Per-minute limit reached.', { ...baseHeaders, 'x-ratelimit-remaining-month': String(Math.max(0, lim.month - used)), 'retry-after': String(perMin.retryAfter) });
  if (used >= lim.month) return err(429, 'monthly_quota_exceeded', 'Monthly API quota reached. It resets on the first day of next month (UTC).', { ...baseHeaders, 'x-ratelimit-remaining-month': '0' });

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');
  const q = url.searchParams;
  let body;
  let counted = true;
  try {
    switch (path) {
      case '/api/v1/volumetric': body = volumetric(q); break;
      case '/api/v1/rates': body = await rates(env, q); break;
      case '/api/v1/hs/search': body = hsSearch(q); break;
      case '/api/v1/tariff/us': body = await usTariff(env, q); break;
      case '/api/v1/eu/landed-cost': body = euCost(q); break;
      case '/api/v1/usage': body = { month: mk, used, limit: lim.month, remaining: Math.max(0, lim.month - used), perMinute: lim.minute }; counted = false; break;
      default: return err(404, 'not_found', 'Unknown endpoint.', baseHeaders);
    }
  } catch (e) {
    const status = e.status && e.status < 600 ? e.status : 500;
    if (status >= 500 && status !== 502) console.error('api error', path, e && e.message);
    const code = e.code || (status === 502 ? 'upstream_error' : status === 500 ? 'internal_error' : 'error');
    return json({ error: code, message: status === 500 ? 'Internal error' : e.message, ...(e.extra || {}) }, status, { ...baseHeaders, 'x-ratelimit-remaining-month': String(Math.max(0, lim.month - used)) });
  }
  let remaining = Math.max(0, lim.month - used);
  if (counted) {
    await kvCount(env, `quota:${email}:${mk}`, 40 * 86_400);
    remaining = Math.max(0, lim.month - used - 1);
  }
  return json(body, 200, { ...baseHeaders, 'x-ratelimit-remaining-month': String(remaining) });
}
