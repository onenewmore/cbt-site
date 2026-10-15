// GET /go/<partner-id>?src=<tool-or-page> — click-out redirect for affiliate partners.
// Server-side counting (ad blockers do not stop it), {src}/{click} substitution for the partner's tracking template, nofollow handled in HTML.
import { randomHex } from './util.mjs';
import { writeEvent } from './events.mjs';
import partners from './generated/partners.mjs';

export function findPartner(id) {
  for (const [catId, cat] of Object.entries(partners.categories)) {
    const p = (cat.partners || []).find((x) => x.id === id);
    if (p) return { partner: p, category: catId };
  }
  return null;
}

export function buildTarget(p, src, click) {
  const u = String(p.url || '');
  if (!/^https?:\/\//i.test(u)) return null;
  return u.replace(/\{src\}/g, encodeURIComponent(src)).replace(/\{click\}/g, encodeURIComponent(click));
}

export async function handleGo(req, env) {
  const url = new URL(req.url);
  const id = decodeURIComponent(url.pathname.replace(/^\/go\//, '').replace(/\/+$/, ''));
  const hit = /^[\w-]{1,60}$/.test(id) ? findPartner(id) : null;
  if (!hit) return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  const src = (url.searchParams.get('src') || '').replace(/[^\w-]/g, '').slice(0, 40);
  const click = randomHex(6);
  const target = buildTarget(hit.partner, src, click);
  if (!target) return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  writeEvent(env, { name: 'affiliate_redirect', lang: '', page: '', type: 'go', country: (req.cf && req.cf.country) || '', cat: hit.category, src, partner: id, where: click });
  return new Response(null, { status: 302, headers: { location: target, 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'origin' } });
}
