// Pure helper functions (no DOM) so they can be unit-tested in Node.
import { UNIT_CATEGORIES } from './data/units.js';

/* ---------- number formatting ---------- */
export function fmt(n, maxDigits = 10) {
  if (n === null || n === undefined || !isFinite(n)) return '--';
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e15 || a < 1e-7) return n.toExponential(4);
  const v = parseFloat(n.toPrecision(maxDigits));
  return v.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/* ---------- volumetric weight ---------- */
// volume (cm³ or in³) × pieces ÷ factor
export function volumetricWeight(l, w, h, factor, qty = 1) {
  return (l * w * h * qty) / factor;
}

// carriers like DHL / FedEx round up to the next 0.5 kg
export function roundUpHalf(x) {
  return Math.ceil(x * 2 - 1e-9) / 2;
}

export const KG_PER_LB = 0.45359237;

/* ---------- unit conversion ---------- */
export function findUnit(cat, id) {
  const groups = UNIT_CATEGORIES[cat].groups;
  for (const g of Object.keys(groups)) {
    const u = groups[g].find((x) => x[0] === id);
    if (u) return u;
  }
  return null;
}

function toCelsius(v, from) {
  if (from === 'c') return v;
  if (from === 'k') return v - 273.15;
  return ((v - 32) * 5) / 9;
}
function fromCelsius(c, to) {
  if (to === 'c') return c;
  if (to === 'k') return c + 273.15;
  return (c * 9) / 5 + 32;
}

// returns { unitId: value } for every unit in the category
export function convertAll(cat, value, fromId) {
  const def = UNIT_CATEGORIES[cat];
  const out = {};
  if (def.special) {
    const c = toCelsius(value, fromId);
    for (const g of Object.values(def.groups)) for (const u of g) out[u[0]] = fromCelsius(c, u[0]);
    return out;
  }
  const from = findUnit(cat, fromId);
  const base = value * from[1];
  for (const g of Object.values(def.groups)) for (const u of g) out[u[0]] = base / u[1];
  return out;
}

/* ---------- time zones ---------- */
const dtfCache = new Map();
function dtf(tz) {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
    });
    dtfCache.set(tz, f);
  }
  return f;
}

export function isValidZone(tz) {
  try { dtf(tz); return true; } catch { return false; }
}

export function zoneParts(date, tz) {
  const o = {};
  for (const p of dtf(tz).formatToParts(date)) o[p.type] = p.value;
  return {
    year: +o.year, month: +o.month, day: +o.day,
    hour: +o.hour % 24, minute: +o.minute, second: +o.second,
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday),
  };
}

export function tzOffsetMinutes(date, tz) {
  const p = zoneParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const t = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((asUtc - t) / 60000);
}

export function isDst(date, tz) {
  const y = zoneParts(date, tz).year;
  const jan = tzOffsetMinutes(new Date(Date.UTC(y, 0, 1)), tz);
  const jul = tzOffsetMinutes(new Date(Date.UTC(y, 6, 1)), tz);
  if (jan === jul) return false;
  return tzOffsetMinutes(date, tz) === Math.max(jan, jul);
}

// wall-clock time in `tz` -> real instant
export function zonedTimeToUtc(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const off = tzOffsetMinutes(new Date(guess), tz);
  let ts = guess - off * 60000;
  const off2 = tzOffsetMinutes(new Date(ts), tz);
  if (off2 !== off) ts = guess - off2 * 60000;
  return new Date(ts);
}

// hours (may be .5 / .75) that zone A is ahead of zone B at `date`
export function diffHours(tzA, tzB, date) {
  return (tzOffsetMinutes(date, tzA) - tzOffsetMinutes(date, tzB)) / 60;
}

export function fmtDiff(h) {
  if (h === 0) return '0';
  const s = Number.isInteger(h) ? String(Math.abs(h)) : String(Math.abs(h));
  return (h > 0 ? '+' : '-') + s;
}

export function pad2(n) { return String(n).padStart(2, '0'); }

export function fmtClock(p) { return `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`; }
export function fmtDate(p) { return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`; }

// 'work' = 09-18 Mon-Fri, 'edge' = 07-09 / 18-22, 'rest' = otherwise
export function workStatus(p) {
  const weekend = p.weekday === 0 || p.weekday === 6;
  if (weekend) return p.hour >= 9 && p.hour < 18 ? 'edge' : 'rest';
  if (p.hour >= 9 && p.hour < 18) return 'work';
  if ((p.hour >= 7 && p.hour < 9) || (p.hour >= 18 && p.hour < 22)) return 'edge';
  return 'rest';
}

/* ---------- tariffs ---------- */
// "Free" -> 0, "6.5%" -> 6.5, "$1.50/kg + 3%" -> specific with ad-valorem part 3
export function parseDuty(str) {
  const s = (str || '').trim();
  if (!s) return { pct: null, specific: false, text: '' };
  if (/^free\b/i.test(s)) return { pct: 0, specific: false, text: s };
  const only = s.match(/^([\d.]+)\s*%$/);
  if (only) return { pct: parseFloat(only[1]), specific: false, text: s };
  const pm = s.match(/([\d.]+)\s*%/);
  return { pct: pm ? parseFloat(pm[1]) : 0, specific: true, text: s };
}

// Chapter 99 lines read like "The duty provided in the applicable subheading + 25%"
export function parseChapter99Add(str) {
  const m = (str || '').match(/\+\s*([\d.]+)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

const norm = (s) => String(s || '').replace(/\D/g, '');

export function formatHts(digits) {
  const d = norm(digits);
  if (d.length <= 4) return d;
  if (d.length <= 6) return d.slice(0, 4) + '.' + d.slice(4);
  if (d.length <= 8) return d.slice(0, 4) + '.' + d.slice(4, 6) + '.' + d.slice(6);
  return d.slice(0, 4) + '.' + d.slice(4, 6) + '.' + d.slice(6, 8) + '.' + d.slice(8, 10);
}

// All Chapter 99 numbers mentioned in the footnotes of an HTS line
export function extract99Refs(item) {
  if (!item) return [];
  const text = JSON.stringify(item.footnotes || []) + ' ' + JSON.stringify(item.additionalDuties || '');
  return [...new Set(text.match(/9903\.\d{2}\.\d{2}/g) || [])];
}

// Choose the rate-bearing line for the user's code from a keyword search result.
export function pickHtsItem(results, digits) {
  const items = (results || []).filter((r) => norm(r.htsno));
  if (digits.length >= 8) {
    const cands = items
      .filter((r) => digits.startsWith(norm(r.htsno)) && norm(r.htsno).length >= 4)
      .sort((a, b) => norm(b.htsno).length - norm(a.htsno).length);
    let item = cands.find((r) => (r.general || '').trim()) || null;
    if (!item) {
      // 8-digit input but the rate sits on the 10-digit statistical lines
      const kids = items.filter((r) => norm(r.htsno).startsWith(digits) && (r.general || '').trim());
      if (kids.length === 1) item = kids[0];
      else if (kids.length > 1) return { item: null, ancestors: [], list: kids };
    }
    if (!item) item = cands[0] || null;
    return { item, ancestors: cands.filter((r) => r !== item), list: [] };
  }
  const list = items.filter((r) => norm(r.htsno).startsWith(digits) && norm(r.htsno).length >= 8);
  return { item: null, ancestors: [], list };
}

// New (2026-07-24) Section 301 "forced labor" additional duty for an origin.
export function newSection301(origin, mfnPct, rules) {
  const mfn = mfnPct ?? 0;
  if (rules.cap10.includes(origin)) return { rate: Math.max(0, 10 - mfn), basis: 'cap10' };
  if (rules.cap125.includes(origin)) return { rate: Math.max(0, 12.5 - mfn), basis: 'cap125' };
  if (rules.tier10.includes(origin)) return { rate: 10, basis: 'tier10' };
  if (rules.tier125.includes(origin)) return { rate: 12.5, basis: 'tier125' };
  if (origin === 'US') return { rate: 0, basis: 'domestic' };
  return { rate: null, basis: 'unknown' };
}

export function euLandedCost({ goods, shipping, dutyPct, vatPct, lowValue, lines, flatEur = 3, threshold = 150 }) {
  const customsValue = goods + shipping;
  let duty;
  let flat = false;
  if (lowValue && goods <= threshold) {
    duty = flatEur * Math.max(1, lines);
    flat = true;
  } else {
    duty = (customsValue * dutyPct) / 100;
  }
  const vat = ((customsValue + duty) * vatPct) / 100;
  return { customsValue, duty, vat, total: customsValue + duty + vat, flat };
}

/* ---------- postal codes ---------- */
export const ZIPPO_COUNTRIES = new Set((
  'AD AR AS AT AU AX BD BE BG BR BY CA CH CZ DE DK DO DZ ES FI FO FR GB GF GG GL GP GT GU HR HU IE IM IN IS IT JE JP ' +
  'LI LK LT LU LV MC MD MH MK MP MQ MT MX MY NL NO NZ PH PK PL PM PR PT RE RO RU SE SG SI SJ SK SM TH TR UA US UY VA VI WF YT ZA'
).split(' '));

export function normalizePostal(cc, raw) {
  let c = String(raw || '').trim().toUpperCase();
  if (!c) return '';
  if (cc === 'GB') { // outward code only
    c = c.includes(' ') ? c.split(/\s+/)[0] : (c.length > 4 ? c.slice(0, -3) : c);
  } else if (cc === 'CA') {
    c = c.replace(/\s+/g, '').slice(0, 3);
  } else if (cc === 'US') {
    c = c.split('-')[0].slice(0, 5);
  } else if (cc === 'NL') {
    c = c.replace(/\s+/g, '').slice(0, 4);
  } else if (cc === 'BR') {
    c = c.replace(/\D/g, '').slice(0, 5);
  } else if (cc === 'IE') {
    c = c.replace(/\s+/g, '').slice(0, 3);
  }
  return c;
}

/* ---------- currency ---------- */
// Every provider is normalised to { base:'USD', date, ts, source, rates:{ CODE: unitsPerUSD } }.
const cleanRates = (obj, allow, upper) => {
  const rates = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const code = upper ? k.toUpperCase() : k;
    if (!/^[A-Z]{3}$/.test(code)) continue;
    if (allow && !allow.has(code)) continue;
    if (typeof v === 'number' && isFinite(v) && v > 0) rates[code] = v;
  }
  rates.USD = 1;
  return rates;
};
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

export function parseErApi(json, allow) {
  if (!json || json.result !== 'success' || !json.rates) return null;
  const ts = (json.time_last_update_unix || 0) * 1000 || Date.now();
  return { base: 'USD', date: isoDate(ts), ts, source: 'open.er-api.com', rates: cleanRates(json.rates, allow, true) };
}

export function parseFawaz(json, allow) {
  if (!json || !json.usd) return null;
  const ts = json.date ? Date.parse(json.date + 'T00:00:00Z') : Date.now();
  return { base: 'USD', date: json.date || isoDate(ts), ts, source: 'currency-api (jsDelivr)', rates: cleanRates(json.usd, allow, true) };
}

export function parseFrankfurter(json, allow) {
  if (!json || !json.rates) return null;
  const ts = json.date ? Date.parse(json.date + 'T00:00:00Z') : Date.now();
  return { base: 'USD', date: json.date || isoDate(ts), ts, source: 'Frankfurter (ECB)', rates: cleanRates(json.rates, allow, true) };
}

// units of `to` per 1 unit of `from`
export function crossRate(from, to, rates) {
  const a = rates[from];
  const b = rates[to];
  if (!a || !b) return null;
  return b / a;
}

export function convertCurrency(amount, from, to, rates, feePct = 0) {
  const r = crossRate(from, to, rates);
  if (r === null || !isFinite(amount)) return null;
  const fee = isFinite(feePct) ? Math.min(Math.max(feePct, 0), 100) : 0;
  return amount * r * (1 - fee / 100);
}

// decimals that keep ~4 significant digits for small rates (JPY->USD = 0.0067)
export function rateDigits(r) {
  if (!isFinite(r) || r === 0) return 2;
  if (r >= 100) return 2;
  if (r >= 1) return 4;
  return Math.min(8, Math.max(4, 3 - Math.floor(Math.log10(r))));
}

export function fmtMoney(n, digits = 2) {
  if (!isFinite(n)) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/* ---------- HS code search (built-in reference list) ---------- */
const CJK_RUN = /[㐀-鿿]+/g;
const stemWord = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

export function hsQueryTerms(q) {
  const s = String(q || '').toLowerCase().trim();
  const runs = s.match(CJK_RUN) || [];
  const latin = s.replace(CJK_RUN, ' ').split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !/^\d+$/.test(w)).map(stemWord);
  const bigrams = [];
  for (const run of runs) {
    if (run.length === 1) bigrams.push(run);
    else for (let i = 0; i < run.length - 1; i++) bigrams.push(run.slice(i, i + 2));
  }
  return { s, latin, runs, bigrams };
}

const hasWord = (hay, w) => (w.length <= 3 ? new RegExp('(^|[^a-z0-9])' + w + 's?([^a-z0-9]|$)').test(hay) : hay.includes(w));

// entry = [hs6, zh, en, keywords, note]
export function scoreHsEntry(terms, entry) {
  const hay = `${entry[1]} ${entry[2]} ${entry[3] || ''}`.toLowerCase();
  if (!terms.s) return 0;
  const shortLatin = /^[a-z0-9]{1,3}$/.test(terms.s);
  if (shortLatin ? hasWord(hay, terms.s) : hay.includes(terms.s)) return 100 + (entry[1].toLowerCase().includes(terms.s) ? 20 : 0);
  let score = 0;
  let need = 0;
  let got = 0;
  for (const w of terms.latin) {
    need++;
    if (hasWord(hay, w)) { got++; score += entry[2].toLowerCase().includes(w) ? 40 : 30; }
  }
  for (const run of terms.runs) if (run.length > 1 && hay.includes(run)) score += 40;
  let bgGot = 0;
  for (const b of terms.bigrams) if (hay.includes(b)) bgGot++;
  if (terms.bigrams.length) {
    need++;
    if (bgGot / terms.bigrams.length >= 0.6) { got++; score += bgGot * 12; }
  }
  if (!need || got < need) return 0;
  return score;
}

export function searchHsCommon(q, list, limit = 30) {
  const terms = hsQueryTerms(q);
  const out = [];
  list.forEach((entry, i) => {
    const score = scoreHsEntry(terms, entry);
    if (score > 0) out.push({ entry, score, i });
  });
  out.sort((a, b) => b.score - a.score || a.i - b.i);
  return out.slice(0, limit).map((x) => x.entry);
}

export function searchHsChapters(q, chapters) {
  const s = String(q || '').toLowerCase().trim();
  if (!s) return [];
  if (/^\d{1,2}$/.test(s)) return chapters.filter((c) => c[0] === s.padStart(2, '0'));
  return chapters.filter((c) => c[1].includes(s) || c[2].toLowerCase().includes(s)).slice(0, 6);
}

export const formatHs6 = (hs6) => (hs6.length >= 6 ? `${hs6.slice(0, 4)}.${hs6.slice(4, 6)}` : hs6);
