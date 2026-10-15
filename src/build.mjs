// Static site generator. Usage: node src/build.mjs [--strict]
//   SITE_URL=https://example.com CONTACT_EMAIL=… COMPANY_NAME=… node src/build.mjs --strict
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, LANGS, loadConfig, readJson, writeFile, copyDir, url, abs, findPlaceholders } from './lib/core.mjs';
import { renderPage } from './lib/layout.mjs';
import { PATCHES } from './lib/patches.mjs';
import { buildPages } from './pages/index.mjs';
import { UI } from '../content/ui.mjs';

const strict = process.argv.includes('--strict');
const EXT_DIR = path.resolve(process.env.EXT_DIR || path.join(ROOT, '..', 'cbt-toolkit'));
const DIST = path.join(ROOT, 'dist');
const warnings = [];
const warn = (m) => warnings.push(m);
// width in "latin character units": CJK glyphs are roughly twice as wide
const width = (s) => [...String(s)].reduce((n, ch) => n + (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);

function hashDir(dir) {
  const h = crypto.createHash('sha1');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else { h.update(p.slice(dir.length)); h.update(fs.readFileSync(p)); }
  });
  walk(dir);
  return h.digest('hex').slice(0, 8);
}

async function main() {
  if (!fs.existsSync(path.join(EXT_DIR, 'manifest.json'))) throw new Error('Extension source not found at ' + EXT_DIR + ' (set EXT_DIR)');
  const cfg = loadConfig();
  const partners = readJson('config/partners.json');
  const policy = readJson('data/policy-updates.json');

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // ---- assets: extension tool code (patched copy) + css + site scripts ----
  const appDst = path.join(DIST, 'assets', 'app');
  copyDir(path.join(EXT_DIR, 'js'), appDst);
  for (const [rel, fn] of Object.entries(PATCHES)) {
    const f = path.join(appDst, rel);
    fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8')));
  }
  fs.mkdirSync(path.join(DIST, 'assets', 'css'), { recursive: true });
  fs.copyFileSync(path.join(EXT_DIR, 'css', 'popup.css'), path.join(DIST, 'assets', 'css', 'tools.css'));
  fs.copyFileSync(path.join(ROOT, 'assets', 'css', 'site.css'), path.join(DIST, 'assets', 'css', 'site.css'));
  copyDir(path.join(ROOT, 'assets', 'js'), path.join(DIST, 'assets', 'site'));
  copyDir(path.join(ROOT, 'assets', 'img'), path.join(DIST, 'assets', 'img'));
  fs.copyFileSync(path.join(EXT_DIR, 'icons', 'icon128.png'), path.join(DIST, 'assets', 'img', 'icon-128.png'));
  if (fs.existsSync(path.join(ROOT, 'public'))) copyDir(path.join(ROOT, 'public'), DIST);

  const v = hashDir(path.join(DIST, 'assets'));
  const ctx = { cfg, ui: UI, partners, policy, v, extDir: EXT_DIR, lang: 'en' };

  // ---- pages ----
  const pages = await buildPages(ctx);
  const seen = new Set();
  const placeholdersLeft = new Map();
  for (const p of pages) {
    const key = p.lang + p.path;
    if (seen.has(key)) throw new Error('duplicate page ' + key);
    seen.add(key);
    if (width(p.title) > 70) warn(`title too long (${width(p.title)} units): ${key} — ${p.title}`);
    if (width(p.desc) > 165) warn(`description too long (${width(p.desc)} units): ${key}`);
    if (width(p.desc) < 50) warn(`description too short (${width(p.desc)} units): ${key}`);
    const html = renderPage(p, { ...ctx, lang: p.lang });
    for (const ph of findPlaceholders(html)) { if (!placeholdersLeft.has(ph)) placeholdersLeft.set(ph, []); placeholdersLeft.get(ph).push(key); }
    const u = url(p.lang, p.path);
    writeFile(DIST, path.posix.join(u, 'index.html').replace(/^\//, ''), html);
  }

  // ---- 404 (single, noindex) ----
  {
    const n = { path: '/404/', lang: 'en', single: true, noindex: true, type: 'page', title: 'Page not found', desc: 'The page you are looking for does not exist.', body: `<h1>Page not found</h1><p class="lead">That page does not exist. Try the <a href="/tools/">tools</a> or go to the <a href="/">home page</a>. / 页面不存在，请前往<a href="/zh/tools/">工具</a>或<a href="/zh/">首页</a>。</p>` };
    writeFile(DIST, '404.html', renderPage(n, { ...ctx, lang: 'en' }));
  }

  // ---- sitemap / robots / headers ----
  const indexable = pages.filter((p) => !p.noindex);
  const byPath = new Map();
  for (const p of indexable) { if (!byPath.has(p.path)) byPath.set(p.path, {}); byPath.get(p.path)[p.lang] = p; }
  const today = new Date().toISOString().slice(0, 10);
  let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  for (const [pth, langs] of byPath) {
    for (const l of LANGS) {
      const p = langs[l];
      if (!p) continue;
      sm += `<url><loc>${abs(cfg, l, pth)}</loc><lastmod>${p.lastmod || today}</lastmod>`;
      for (const l2 of LANGS) if (langs[l2]) sm += `<xhtml:link rel="alternate" hreflang="${l2 === 'zh' ? 'zh-Hans' : 'en'}" href="${abs(cfg, l2, pth)}"/>`;
      sm += `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(cfg, 'en', pth)}"/></url>\n`;
    }
  }
  sm += '</urlset>\n';
  writeFile(DIST, 'sitemap.xml', sm);
  writeFile(DIST, 'robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /go/\nDisallow: /account/\nDisallow: /zh/account/\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
  writeFile(DIST, '_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/assets/*\n  Cache-Control: public, max-age=3600\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n`);

  // ---- worker bundle data (partners + policy + shared calc/data modules) ----
  const gen = path.join(ROOT, 'worker', 'src', 'generated');
  fs.rmSync(gen, { recursive: true, force: true });
  fs.mkdirSync(path.join(gen, 'js', 'data'), { recursive: true });
  const mjs = (name, data) => fs.writeFileSync(path.join(gen, name), `// generated by src/build.mjs — do not edit\nexport default ${JSON.stringify(data, null, 2)};\n`);
  mjs('partners.mjs', partners);
  mjs('policy-updates.mjs', policy);
  mjs('site-config.mjs', { siteUrl: cfg.siteUrl, brand: cfg.brand, company: cfg.company, contactEmail: cfg.contactEmail, free: cfg.free, pro: cfg.pro, pricing: cfg.pricing });
  for (const f of ['calc.js', 'data/units.js', 'data/rules.js', 'data/countries.js', 'data/hsdata.js', 'data/imgpresets.js']) fs.copyFileSync(path.join(EXT_DIR, 'js', f), path.join(gen, 'js', f));

  // ---- internal link check ----
  const exists = new Set([...seen].map((k) => url(k.startsWith('zh') ? 'zh' : 'en', k.replace(/^(en|zh)/, ''))));
  const broken = [];
  for (const p of pages) {
    const file = path.join(DIST, url(p.lang, p.path), 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const href = m[1];
      if (/^\/(assets|api|go)\//.test(href) || href === '/sitemap.xml') continue;
      const norm = href.endsWith('/') ? href : href + '/';
      if (!exists.has(norm) && !fs.existsSync(path.join(DIST, href.replace(/^\//, '')))) broken.push(`${p.lang}${p.path} → ${href}`);
    }
  }
  if (broken.length) throw new Error('Broken internal links:\n  ' + [...new Set(broken)].slice(0, 30).join('\n  '));

  // ---- report ----
  const leftovers = [...placeholdersLeft.keys()];
  if (leftovers.length) warn(`unreplaced placeholders: ${leftovers.join(', ')} (e.g. ${placeholdersLeft.get(leftovers[0])[0]})`);
  if (cfg.siteUrl.includes('YOUR-DOMAIN')) warn('siteUrl is still the placeholder (set SITE_URL)');
  if (!fs.existsSync(path.join(DIST, 'assets', 'img', 'og.png'))) warn('assets/img/og.png missing (Open Graph image)');
  console.log(`Built ${pages.length} pages (${indexable.length} indexable) → dist/  [asset version ${v}]`);
  const counts = {};
  for (const p of pages) counts[p.type || 'page'] = (counts[p.type || 'page'] || 0) + 1;
  console.log('By type:', JSON.stringify(counts));
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log('  - ' + w);
    if (strict) { console.error('\n--strict: failing because of warnings above'); process.exit(1); }
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
