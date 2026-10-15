// GET /api/p/<key>/<path> — same-origin, allow-listed, cached proxy for the data providers the browser tools call.
// Why: no CORS surprises, one polite User-Agent, edge caching (important for Nominatim's usage policy), and one place to swap providers.
import { err, clientIp, memLimit } from './util.mjs';
import { UPSTREAMS, cachedGet } from './fetchers.mjs';

export async function handleProxy(req, env) {
  if (req.method !== 'GET') return err(405, 'method_not_allowed');
  const url = new URL(req.url);
  const m = /^\/api\/p\/([a-z]+)(\/.*)$/.exec(url.pathname);
  const up = m && UPSTREAMS[m[1]];
  if (!up || !up.ok(m[2])) return err(404, 'unknown_upstream');
  if (!memLimit('proxy', clientIp(req), 120)) return err(429, 'rate_limited', undefined, { 'retry-after': '30' });
  const target = up.origin + m[2] + url.search;
  if (target.length > 600) return err(414, 'too_long');
  try {
    const r = await cachedGet(env, target, up.ttl);
    return new Response(r.body, {
      status: r.status === 200 ? 200 : 502,
      headers: { 'content-type': r.contentType, 'cache-control': r.status === 200 ? 'public, max-age=300' : 'no-store', 'x-cbt-cache': r.hit ? 'hit' : 'miss', 'x-content-type-options': 'nosniff' },
    });
  } catch {
    return err(502, 'upstream_error');
  }
}
