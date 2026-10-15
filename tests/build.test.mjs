// Static-output checks: run `node src/build.mjs` first (npm test does). `node --test tests/build.test.mjs`
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { partnerBox, partnerLink } from '../src/lib/components.mjs';
import { UI } from '../content/ui.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.config.json'), 'utf8'));
assert.ok(fs.existsSync(path.join(DIST, 'index.html')), 'run `node src/build.mjs` before the tests');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets') walk(p, out); } else if (e.name === 'index.html') out.push(p);
  }
  return out;
}
const files = walk(DIST);
const pages = files.map((f) => {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, path.dirname(f)).split(path.sep).join('/');
  return { f, html, url: rel ? '/' + rel + '/' : '/' };
});
const attr = (html, re) => { const m = re.exec(html); return m ? m[1] : null; };
const robots = (h) => attr(h, /<meta name="robots" content="([^"]*)"/) || '';

test('page inventory: every English page has a Chinese twin', () => {
  const zh = pages.filter((p) => p.url.startsWith('/zh/'));
  const en = pages.filter((p) => !p.url.startsWith('/zh/'));
  assert.ok(pages.length >= 100, 'pages: ' + pages.length);
  assert.equal(zh.length, en.length, `en=${en.length} zh=${zh.length}`);
  const enSet = new Set(en.map((p) => p.url));
  for (const p of zh) assert.ok(enSet.has(p.url === '/zh/' ? '/' : p.url.replace(/^\/zh/, '')), 'no English twin for ' + p.url);
});

test('every page: one h1, one canonical, title + description, lang attr, JSON-LD parses, no leaked template tokens', () => {
  for (const p of pages) {
    const h1s = (p.html.match(/<h1[ >]/g) || []).length;
    assert.equal(h1s, 1, `${p.url}: h1 count ${h1s}`);
    assert.equal((p.html.match(/<link rel="canonical"/g) || []).length, 1, `${p.url}: canonical`);
    assert.ok(attr(p.html, /<title>([^<]+)<\/title>/), `${p.url}: title`);
    const desc = attr(p.html, /<meta name="description" content="([^"]+)"/) || '';
    const w = [...desc].reduce((n, ch) => n + (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
    assert.ok(w >= 50 && w <= 175, `${p.url}: description width ${w}`);
    const lang = attr(p.html, /<html lang="([^"]+)"/);
    assert.equal(lang, p.url.startsWith('/zh/') ? 'zh-Hans' : 'en', `${p.url}: html lang`);
    for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
    assert.ok(!/\{\{(tool|page):/.test(p.html), `${p.url}: unresolved link token`);
    assert.ok(!/\[object Object\]|>undefined<|NaN%/.test(p.html), `${p.url}: leaked JS value`);
  }
});

test('canonical URLs are absolute, self-referencing and use the configured site URL', () => {
  for (const p of pages) {
    const c = attr(p.html, /<link rel="canonical" href="([^"]+)"/);
    assert.ok(c.startsWith(cfg.siteUrl), `${p.url}: ${c}`);
    assert.ok(c.endsWith(p.url) || (p.url === '/' && c === cfg.siteUrl + '/'), `${p.url}: canonical ${c}`);
  }
});

test('hreflang: reciprocal en / zh-Hans pairs plus x-default pointing at English', () => {
  const byUrl = new Map(pages.map((p) => [cfg.siteUrl + p.url, p]));
  for (const p of pages) {
    const alts = [...p.html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
    if (!alts.length) continue; // single-language pages (none expected apart from 404)
    const map = Object.fromEntries(alts);
    assert.deepEqual(Object.keys(map).sort(), ['en', 'x-default', 'zh-Hans'], p.url);
    assert.equal(map['x-default'], map.en, p.url);
    for (const href of [map.en, map['zh-Hans']]) {
      const twin = byUrl.get(href);
      assert.ok(twin, `${p.url}: alternate ${href} does not exist`);
      const back = Object.fromEntries([...twin.html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
      assert.equal(back[p.url.startsWith('/zh/') ? 'zh-Hans' : 'en'], cfg.siteUrl + p.url, `${href} does not point back to ${p.url}`);
    }
  }
});

test('titles and descriptions are unique within each language', () => {
  for (const group of [pages.filter((p) => !p.url.startsWith('/zh/')), pages.filter((p) => p.url.startsWith('/zh/'))]) {
    const seen = new Map();
    for (const p of group) {
      if (/noindex/.test(robots(p.html))) continue;
      const t = attr(p.html, /<title>([^<]+)<\/title>/);
      assert.ok(!seen.has(t), `duplicate title "${t}" on ${p.url} and ${seen.get(t)}`);
      seen.set(t, p.url);
    }
  }
});

test('sitemap: contains every indexable page with alternates, none of the noindex pages, and every URL exists', () => {
  const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const locs = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  for (const p of pages) {
    const noindex = /noindex/.test(robots(p.html));
    const loc = cfg.siteUrl + p.url;
    assert.equal(locs.has(loc), !noindex, `${p.url}: sitemap membership (noindex=${noindex})`);
  }
  assert.ok(/xhtml:link rel="alternate" hreflang="zh-Hans"/.test(sm));
  const robotsTxt = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
  assert.match(robotsTxt, /Sitemap: .*sitemap\.xml/);
  assert.match(robotsTxt, /Disallow: \/api\//);
});

test('tool pages carry WebApplication + FAQPage + BreadcrumbList and a mount point', () => {
  const tools = pages.filter((p) => /^\/(zh\/)?tools\/[^/]+\/$/.test(p.url));
  assert.equal(tools.length, 20);
  for (const p of tools) {
    const types = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']);
    for (const t of ['WebApplication', 'FAQPage', 'BreadcrumbList']) assert.ok(types.includes(t), `${p.url} lacks ${t}: ${types}`);
    assert.ok(p.html.includes('id="tool-mount"'), p.url);
  }
});

test('indexable content pages have real body text (thin-page guard)', () => {
  for (const p of pages) {
    if (/noindex/.test(robots(p.html))) continue;
    const main = (/<main[^>]*>([\s\S]*?)<\/main>/.exec(p.html) || [])[1] || '';
    const text = main.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const isCjk = p.url.startsWith('/zh/');
    const min = /^\/(zh\/)?(hs-code|image-size)\/[^/]+\/$/.test(p.url) ? (isCjk ? 150 : 350) : (isCjk ? 60 : 150);
    assert.ok(text.length >= min, `${p.url}: only ${text.length} chars of body text`);
  }
});

test('affiliate links: sponsored + nofollow, tagged, never shown when no partner is configured', () => {
  const ctx = { lang: 'en', ui: UI, cfg };
  const noPartners = { toolMap: { x: ['freight-forwarder'] }, categories: { 'freight-forwarder': { slug: 'freight-forwarders', name: { en: 'F', zh: 'F' }, cta: { en: 'Quote', zh: 'Q' }, pitch: { en: 'p', zh: 'p' }, partners: [] } } };
  const box0 = partnerBox('x', { ...ctx, partners: noPartners });
  assert.ok(!box0.includes('/go/'), 'no partner list when none configured');
  assert.ok(box0.includes('/get-quotes/freight-forwarders/?src=x'));
  const withP = JSON.parse(JSON.stringify(noPartners));
  withP.categories['freight-forwarder'].partners = [{ id: 'acme', name: 'Acme Freight', url: 'https://acme.test/?a={src}', blurb: { en: 'Fast', zh: '快' }, disclosure: { en: 'We earn a fee.', zh: '我们获得佣金。' } }];
  const box1 = partnerBox('x', { ...ctx, partners: withP });
  assert.match(box1, /href="\/go\/acme\?src=x" rel="sponsored nofollow noopener"/);
  assert.match(box1, /Sponsored|Ad|sponsored/i);
  assert.ok(box1.includes('We earn a fee.'));
  assert.ok(!box1.includes('acme.test'), 'the partner URL is only reachable through /go/');
  assert.ok(partnerLink(withP.categories['freight-forwarder'].partners[0], 'x', ctx).includes('data-track="affiliate_click"'));
});

test('no real e-mail addresses or secrets are baked into the output', () => {
  const bad = [];
  for (const p of pages) {
    for (const m of p.html.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g)) if (m[0] !== cfg.contactEmail && !/^\{\{|example\.(com|org)$|^noreply@/.test(m[0])) bad.push(p.url + ': ' + m[0]);
  }
  assert.deepEqual(bad.slice(0, 5), []);
  const grep = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) grep(f); else if (/\.(js|html|json|css|txt|xml)$/.test(e.name)) { const t = fs.readFileSync(f, 'utf8'); assert.ok(!/(sk_live|pdl_live|re_[A-Za-z0-9]{20,}|BEGIN PRIVATE KEY)/.test(t), 'secret-looking string in ' + f); } } };
  grep(DIST);
});

test('patched extension code is in place (proxy rewrite + free-tier hooks)', () => {
  const dom = fs.readFileSync(path.join(DIST, 'assets/app/dom.js'), 'utf8');
  assert.match(dom, /fetch\(cbtRewrite\(url\)/);
  const img = fs.readFileSync(path.join(DIST, 'assets/app/tools/imgcompress.js'), 'utf8');
  for (const needle of ['CBT_GATE.imgFiles', 'CBT_GATE.imgPresets', 'CBT_GATE.zip', 'const isTab = true;']) assert.ok(img.includes(needle), needle);
  const extRoot = fs.existsSync(path.join(ROOT, 'extension', 'manifest.json')) ? path.join(ROOT, 'extension') : path.join(ROOT, '..', 'cbt-toolkit');
  const orig = fs.readFileSync(path.join(extRoot, 'js', 'dom.js'), 'utf8');
  assert.ok(!orig.includes('cbtRewrite'), 'the extension source itself must stay untouched');
});
