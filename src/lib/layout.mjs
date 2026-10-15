// Page shell: <head> SEO, header, footer. Everything is server-rendered into static HTML.
import { esc, escJson, url, abs, HTML_LANG, LANGS, resolveTokens } from './core.mjs';
import { TOOLS } from '../../content/tools.mjs';

const ORG_NAME = (cfg) => cfg.brand;

export function head(page, ctx) {
  const { cfg, lang } = ctx;
  const canonical = abs(cfg, lang, page.path);
  const alts = page.single ? [] : LANGS.map((l) => ({ l, href: abs(cfg, l, page.path) }));
  const ogImg = cfg.siteUrl + '/assets/img/og.png';
  const robots = page.noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">';
  const jsonld = (page.jsonld || []).map((o) => `<script type="application/ld+json">${escJson(o)}</script>`).join('\n');
  const clientCfg = {
    lang, siteUrl: cfg.siteUrl, path: page.path, type: page.type || 'page',
    analytics: cfg.analytics, paddle: { env: cfg.paddle.env, clientToken: cfg.paddle.clientToken, prices: cfg.paddle.prices },
    toolSlugs: Object.fromEntries(TOOLS.map((t) => [t.id, t.slug])), pricing: cfg.pricing, free: cfg.free, pro: cfg.pro, turnstileSiteKey: cfg.turnstileSiteKey, tool: page.toolId || null, slug: page.slug || null,
  };
  const plausible = cfg.analytics.plausibleDomain
    ? `<script defer data-domain="${esc(cfg.analytics.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>
<script>window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}</script>`
    : '';
  return `<!doctype html>
<html lang="${HTML_LANG[lang]}" data-lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
${robots}
<link rel="canonical" href="${esc(canonical)}">
${alts.map((a) => `<link rel="alternate" hreflang="${HTML_LANG[a.l]}" href="${esc(a.href)}">`).join('\n')}
${alts.length ? `<link rel="alternate" hreflang="x-default" href="${esc(abs(cfg, 'en', page.path))}">` : ''}
<meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(ORG_NAME(cfg))}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:locale" content="${lang === 'zh' ? 'zh_CN' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/img/icon-128.png">
<link rel="apple-touch-icon" href="/assets/img/icon-128.png">
<link rel="stylesheet" href="/assets/css/tools.css?v=${ctx.v}">
<link rel="stylesheet" href="/assets/css/site.css?v=${ctx.v}">
${jsonld}
<script type="application/json" id="cbt-config">${escJson(clientCfg)}</script>
${plausible}
</head>`;
}

export function header(page, ctx) {
  const { cfg, lang, ui } = ctx;
  const u = ui[lang];
  const other = lang === 'en' ? 'zh' : 'en';
  const otherHref = page.single ? url(other, '/') : url(other, page.path);
  const link = (p, label) => `<a href="${url(lang, p)}"${(page.section || page.path) === p ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  return `<body data-lang="${lang}" data-page-type="${esc(page.type || 'page')}"${page.toolId ? ` data-tool="${esc(page.toolId)}"` : ''}>
<a class="skip" href="#main">${esc(u.common.skip)}</a>
<header class="site-header">
  <div class="wrap hdr">
    <a class="brand" href="${url(lang, '/')}"><img src="/assets/img/icon-128.png" width="28" height="28" alt=""><span>${esc(lang === 'zh' ? cfg.brandZh : cfg.brand)}</span></a>
    <nav class="main-nav" aria-label="Main">
      ${link('/tools/', u.nav.tools)}
      ${link('/image-size/', u.nav.imageSize)}
      ${link('/hs-code/', u.nav.hs)}
      ${link('/guides/', u.nav.guides)}
      ${link('/policy-updates/', u.nav.policy)}
      ${link('/get-quotes/', u.nav.quotes)}
      ${link('/pricing/', u.nav.pricing)}
    </nav>
    <div class="hdr-right">
      <a class="lang-switch" href="${otherHref}" hreflang="${HTML_LANG[other]}" lang="${HTML_LANG[other]}" data-track="lang_switch">${esc(u.otherLangName)}</a>
      <a class="btn-acct" id="nav-account" href="${url(lang, '/account/')}" data-signin="${esc(u.nav.account)}" data-account="${esc(u.nav.accountPro)}">${esc(u.nav.account)}</a>
    </div>
  </div>
</header>`;
}

export function footer(page, ctx) {
  const { cfg, lang, ui } = ctx;
  const u = ui[lang];
  const f = u.footer;
  const L = (p) => url(lang, p);
  return `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div>
      <div class="foot-brand"><img src="/assets/img/icon-128.png" width="24" height="24" alt=""> ${esc(lang === 'zh' ? cfg.brandZh : cfg.brand)}</div>
      <p class="muted small">${esc(u.common.disclaimerShort)}</p>
      <p class="small"><a href="${esc(cfg.extensionUrl)}" rel="noopener" data-track="extension_click">${esc(u.common.getExt)}</a></p>
    </div>
    <div><h3>${esc(f.tools)}</h3><ul>${TOOLS.map((t) => `<li><a href="${L('/tools/' + t.slug + '/')}">${esc(t[lang].nav)}</a></li>`).join('')}</ul></div>
    <div><h3>${esc(f.resources)}</h3><ul>
      <li><a href="${L('/image-size/')}">${esc(u.nav.imageSize)}</a></li>
      <li><a href="${L('/hs-code/')}">${esc(u.nav.hs)}</a></li>
      <li><a href="${L('/guides/')}">${esc(u.nav.guides)}</a></li>
      <li><a href="${L('/policy-updates/')}">${esc(u.nav.policy)}</a></li>
      <li><a href="${L('/pro/bulk/')}">${esc(u.bulk.h1)}</a></li>
      <li><a href="${L('/docs/api/')}">${esc(f.api)}</a></li>
      <li><a href="${L('/pricing/')}">${esc(u.nav.pricing)}</a></li></ul></div>
    <div><h3>${esc(f.company)}</h3><ul>
      <li><a href="${L('/about/')}">${esc(f.about)}</a></li>
      <li><a href="${L('/contact/')}">${esc(f.contact)}</a></li>
      <li><a href="${L('/privacy/')}">${esc(f.privacy)}</a></li>
      <li><a href="${L('/terms/')}">${esc(f.terms)}</a></li>
      <li><a href="${L('/refund/')}">${esc(f.refund)}</a></li>
      <li><a href="${L('/affiliate-disclosure/')}">${esc(f.affiliate)}</a></li></ul></div>
  </div>
  <div class="wrap small muted foot-bottom">© ${new Date().getFullYear()} ${esc(cfg.company)}. ${esc(f.rights)}</div>
</footer>`;
}

export function renderPage(page, ctx) {
  const scripts = ['/assets/site/site.js', ...(page.scripts || [])]
    .map((s) => `<script type="module" src="${s}?v=${ctx.v}"></script>`).join('\n');
  const html = `${head(page, ctx)}
${header(page, ctx)}
<main id="main" class="${esc(page.mainClass || 'wrap')}">
${page.body}
</main>
${footer(page, ctx)}
${scripts}
</body>
</html>`;
  return resolveTokens(html, ctx.lang, ctx.cfg);
}

export function breadcrumbs(items, ctx) {
  // items: [{label, path?}] — last has no path
  const { lang, ui } = ctx;
  const trail = [{ label: ui[lang].common.home, path: '/' }, ...items];
  return `<nav class="crumbs" aria-label="Breadcrumb">${trail.map((it, i) => (it.path && i < trail.length - 1 ? `<a href="${url(lang, it.path)}">${esc(it.label)}</a>` : `<span aria-current="page">${esc(it.label)}</span>`)).join(' <span aria-hidden="true">›</span> ')}</nav>`;
}

export function breadcrumbLd(items, ctx) {
  const { cfg, lang, ui } = ctx;
  const trail = [{ label: ui[lang].common.home, path: '/' }, ...items];
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, ...(it.path ? { item: abs(cfg, lang, it.path) } : {}) })),
  };
}

export function faqLd(faq) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
}

export function faqHtml(faq, ctx) {
  const { lang, ui } = ctx;
  return `<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">${esc(ui[lang].common.faq)}</h2>
${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}</section>`;
}
