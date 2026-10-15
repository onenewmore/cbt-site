// First-party, cookie-free event intake -> Cloudflare Workers Analytics Engine.
// No IP, no user-agent string and no identifier is stored; "return visits" come from anonymous buckets the browser computes locally.
//
// Data point layout (keep in sync with docs/ANALYTICS.md):
//   index1 = event name                       double1 = 1
//   blob1 event | blob2 lang | blob3 page | blob4 page type | blob5 country | blob6 referrer class (direct|internal|organic|social|other)
//   blob7 referrer host | blob8 tool | blob9 category | blob10 src | blob11 partner | blob12 visits bucket | blob13 since-first bucket
//   blob14 since-last bucket | blob15 plan/pro flag | blob16 where/what/reason/tab | blob17 device (mobile|desktop)
import { memLimit, clientIp } from './util.mjs';

export const EVENT_NAMES = new Set([
  'pageview', 'new_visitor', 'return_visit', 'tool_use', 'copy_result', 'pro_cta', 'checkout_open', 'checkout_complete', 'checkout_closed', 'checkout_return',
  'limit_hit', 'export_click', 'bulk_run', 'bulk_tab', 'lead_form_start', 'lead_submit', 'affiliate_click', 'quote_cta', 'signin_ok', 'login_request',
  'apikey_rotate', 'extension_click', 'lang_switch',
]);

const SEARCH_RE = /(^|\.)(google|bing|baidu|duckduckgo|yahoo|yandex|naver|sogou|ecosia|brave|startpage|qwant|seznam)\.[a-z.]{2,}$|(^|\.)so\.com$/;
const SOCIAL_RE = /(^|\.)(facebook|instagram|linkedin|reddit|youtube|tiktok|pinterest|weibo|zhihu|xiaohongshu|weixin|qq|twitter|x|t|lnkd|quora|medium)\.(com|cn|co|in|me)$/;
export function refClass(host) {
  if (host === 'internal') return 'internal';
  if (!host || host === 'direct') return 'direct';
  if (SEARCH_RE.test(host)) return 'organic';
  if (SOCIAL_RE.test(host)) return 'social';
  return 'other';
}

const s = (v, n = 100) => String(v ?? '').replace(/[^\w.\-/:+ ]/g, '').slice(0, n);

export function writeEvent(env, f) {
  if (!env.EVENTS) return false;
  try {
    env.EVENTS.writeDataPoint({
      indexes: [s(f.name, 60)],
      blobs: [f.name, f.lang, f.page, f.type, f.country, f.refClass, f.refHost, f.tool, f.cat, f.src, f.partner, f.visits, f.sinceFirst, f.sinceLast, f.plan, f.where, f.device].map((x) => s(x)),
      doubles: [1],
    });
    return true;
  } catch (e) { console.error('analytics write failed', e && e.message); return false; }
}

export async function handleEvent(req, env) {
  const noContent = new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const ua = req.headers.get('user-agent') || '';
  if (/bot|crawl|spider|headless|lighthouse|pingdom|monitor|curl|python|node-fetch/i.test(ua)) return noContent;
  if (!memLimit('events', clientIp(req), 180)) return noContent;
  let text = '';
  try { text = await req.text(); } catch { return noContent; }
  if (!text || text.length > 2048) return noContent;
  let b;
  try { b = JSON.parse(text); } catch { return noContent; }
  const name = b && b.n;
  if (!EVENT_NAMES.has(name)) return noContent;
  const p = (b.p && typeof b.p === 'object') ? b.p : {};
  const refHost = s(p.ref, 80).toLowerCase();
  writeEvent(env, {
    name, lang: p.lang === 'zh' ? 'zh' : 'en', page: p.page, type: p.type, country: (req.cf && req.cf.country) || '',
    refClass: p.ref !== undefined ? refClass(refHost) : '', refHost: p.ref !== undefined ? refHost : '',
    tool: p.tool, cat: p.cat, src: p.src, partner: p.partner, visits: p.visits, sinceFirst: p.since_first_days, sinceLast: p.since_last_days,
    plan: p.plan || (p.pro !== undefined ? 'pro' + p.pro : ''), where: p.where || p.what || p.reason || p.tab || '',
    device: /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop',
  });
  return noContent;
}
