// Generates every page object. Each page: { path, lang, title, desc, body, type, jsonld, noindex, single, section, toolId, slug, scripts, lastmod }
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { esc, url, abs, LANGS, ROOT } from '../lib/core.mjs';
import { breadcrumbs, breadcrumbLd, faqHtml, faqLd } from '../lib/layout.mjs';
import { partnerBox, quoteForm, proStrip, toolCard, partnerLink, partnerCats } from '../lib/components.mjs';
import { TOOLS, toolBySlug } from '../../content/tools.mjs';
import { GUIDES } from '../../content/guides.mjs';
import { LEGAL } from '../../content/ui.mjs';

export async function loadExtData(extDir) {
  const imp = (rel) => import(pathToFileURL(path.join(extDir, 'js', 'data', rel)).href);
  const [hs, img, countries] = await Promise.all([imp('hsdata.js'), imp('imgpresets.js'), imp('countries.js')]);
  return { HS_CHAPTERS: hs.HS_CHAPTERS, HS_COMMON: hs.HS_COMMON, IMG_PLATFORMS: img.IMG_PLATFORMS, IMG_PRESETS_ASOF: img.IMG_PRESETS_ASOF, COUNTRIES: countries.COUNTRIES, countryName: countries.countryName };
}

const webApp = (t, lang, ctx) => ({
  '@context': 'https://schema.org', '@type': 'WebApplication', name: t[lang].h1, url: abs(ctx.cfg, lang, `/tools/${t.slug}/`),
  description: t[lang].desc, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', inLanguage: lang === 'zh' ? 'zh-Hans' : 'en',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isAccessibleForFree: true,
});

function toolPages(ctx) {
  const pages = [];
  const { cfg, ext, partners } = ctx;
  for (const t of TOOLS) {
    for (const lang of LANGS) {
      const c = t[lang];
      const u = ctx.ui[lang];
      const crumbs = [{ label: u.nav.tools, path: '/tools/' }, { label: c.nav }];
      let staticTable = '';
      if (t.staticTable === 'countries') {
        const coll = new Intl.Collator(lang === 'zh' ? 'zh-Hans-CN-u-co-pinyin' : 'en');
        const rows = ext.COUNTRIES.map((x) => ({ ...x, name: ext.countryName(x.a2, lang) })).sort((a, b) => coll.compare(a.name, b.name));
        const head = lang === 'zh' ? ['国家/地区', '二字码', '三字码', '电话区号'] : ['Country / region', 'Alpha-2', 'Alpha-3', 'Dialing code'];
        staticTable = `<section class="static-table"><h2>${lang === 'zh' ? '完整列表' : 'Full list'}</h2>
          <div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
          ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td><code>${r.a2}</code></td><td><code>${r.a3}</code></td><td>+${esc(r.dial)}</td></tr>`).join('')}
          </tbody></table></div></section>`;
      }
      const related = t.related.map((s) => toolBySlug[s]).filter(Boolean);
      const proText = t.id === 'imgcompress'
        ? (lang === 'zh' ? `免费版每次 ${cfg.free.imageFilesPerRun} 张图 × ${cfg.free.imagePresetsPerRun} 个预设。Pro 解锁不限量批量和 ZIP 下载。` : `Free: ${cfg.free.imageFilesPerRun} images × ${cfg.free.imagePresetsPerRun} presets per run. Pro unlocks unlimited batches and ZIP download.`)
        : (lang === 'zh' ? '需要批量处理或导出结果？Pro 支持 CSV 批量、导出、API 和政策提醒。' : 'Need bulk runs or exports? Pro adds CSV batches, export, API access and policy alerts.');
      const body = `
${breadcrumbs(crumbs, ctx2(ctx, lang))}
<h1>${esc(c.h1)}</h1>
<p class="lead">${esc(c.lead)}</p>
<section id="tool" class="tool-card" aria-label="${esc(c.h1)}">
  <div id="tool-mount"><div class="loading">…</div><noscript><p class="warn">${esc(u.common.noscript)}</p></noscript></div>
</section>
${proStrip(ctx2(ctx, lang), proText)}
${partnerBox(t.slug, ctx2(ctx, lang))}
<article class="prose">
${c.sections.map((s) => `<section><h2>${esc(s.h)}</h2>${s.body}</section>`).join('\n')}
</article>
${staticTable}
${faqHtml(c.faq, ctx2(ctx, lang))}
<section class="related"><h2>${esc(u.common.related)}</h2><div class="cards">${related.map((r) => toolCard(r, ctx2(ctx, lang))).join('')}</div></section>
<p class="muted small disclaimer">${esc(u.common.disclaimerShort)} ${esc(u.common.updated)}: ${esc(t.updated)}.</p>`;
      pages.push({
        path: `/tools/${t.slug}/`, lang, title: c.title, desc: c.desc, body, type: 'tool', section: '/tools/', toolId: t.id, slug: t.slug,
        scripts: ['/assets/site/tool-page.js'], lastmod: t.updated,
        jsonld: [webApp(t, lang, ctx), faqLd(c.faq), breadcrumbLd(crumbs, ctx2(ctx, lang))],
      });
    }
  }
  return pages;
}
const ctx2 = (ctx, lang) => ({ ...ctx, lang });

function toolsHub(ctx) {
  return LANGS.map((lang) => {
    const u = ctx.ui[lang];
    const c = ctx2(ctx, lang);
    const title = lang === 'zh' ? '跨境电商工具大全：体积重、汇率、HS 编码、关税、邮编、图片尺寸' : 'Cross-border Seller Tools: Weight, FX, HS Codes, Duties';
    const desc = lang === 'zh' ? '10 个免费跨境电商工具：体积重、单位换算、汇率、时区、国家代码、HS 编码、美国关税、欧盟关税、邮编和平台图片尺寸。' : 'Ten free tools for cross-border sellers: volumetric weight, units, currency, time zones, country codes, HS codes, US and EU duty, postal codes and image sizes.';
    const crumbs = [{ label: u.nav.tools }];
    return {
      path: '/tools/', lang, title, desc, type: 'hub', section: '/tools/', lastmod: '2026-10-14',
      jsonld: [breadcrumbLd(crumbs, c)],
      body: `${breadcrumbs(crumbs, c)}<h1>${esc(u.home.toolsH)}</h1><p class="lead">${esc(u.home.lead)}</p><div class="cards">${TOOLS.map((t) => toolCard(t, c)).join('')}</div>`,
    };
  });
}

function homePages(ctx) {
  return LANGS.map((lang) => {
    const u = ctx.ui[lang];
    const c = ctx2(ctx, lang);
    const h = u.home;
    const quoteCats = Object.values(ctx.partners.categories);
    const body = `
<section class="hero">
  <h1>${esc(h.h1)}</h1>
  <p class="lead">${esc(h.lead)}</p>
  <ul class="trust">${h.trust.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <p><a class="btn primary" href="${url(lang, '/tools/')}">${esc(h.toolsH)}</a> <a class="btn" href="${esc(ctx.cfg.extensionUrl)}" rel="noopener" data-track="extension_click">${esc(h.extCta)}</a></p>
</section>
<section><h2>${esc(h.toolsH)}</h2><div class="cards">${TOOLS.map((t) => toolCard(t, c)).join('')}</div></section>
<section><h2>${esc(h.imageH)}</h2>
  <p class="chips">${ctx.ext.IMG_PLATFORMS.map((p) => `<a class="chip" href="${url(lang, '/image-size/' + p.id + '/')}">${esc(lang === 'zh' ? p.zh : p.en)}</a>`).join('')}</p></section>
<section class="band"><h2>${esc(h.proH)}</h2><p>${esc(h.proLead)}</p><p><a class="btn primary" href="${url(lang, '/pricing/')}" data-track="pro_cta" data-where="home">${esc(h.proCta)}</a></p></section>
<section><h2>${esc(h.guidesH)}</h2><div class="cards">${GUIDES.map((g) => `<a class="card" href="${url(lang, '/guides/' + g.slug + '/')}"><span class="card-t">${esc(g[lang].h1)}</span><span class="card-d">${esc(g[lang].lead)}</span></a>`).join('')}</div></section>
<section class="band alt"><h2>${esc(h.quotesH)}</h2><p>${esc(h.quotesLead)}</p><p class="chips">${quoteCats.map((q) => `<a class="chip" href="${url(lang, '/get-quotes/' + q.slug + '/')}">${esc(q.name[lang])}</a>`).join('')}</p></section>`;
    const ld = [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: lang === 'zh' ? ctx.cfg.brandZh : ctx.cfg.brand, url: abs(ctx.cfg, lang, '/'), inLanguage: lang === 'zh' ? 'zh-Hans' : 'en' },
      { '@context': 'https://schema.org', '@type': 'Organization', name: ctx.cfg.company, url: ctx.cfg.siteUrl, logo: ctx.cfg.siteUrl + '/assets/img/icon-128.png' },
    ];
    return { path: '/', lang, title: h.title, desc: h.desc, body, type: 'home', section: '/', jsonld: ld, lastmod: '2026-10-14' };
  });
}

function imageSizePages(ctx) {
  const pages = [];
  const { ext } = ctx;
  for (const lang of LANGS) {
    const u = ctx.ui[lang];
    const c = ctx2(ctx, lang);
    const is = u.imageSize;
    const caveat = is.caveat.replace('{asOf}', ext.IMG_PRESETS_ASOF);
    const crumbsHub = [{ label: is.hubH1 }];
    pages.push({
      path: '/image-size/', lang, title: is.hubTitle, desc: is.hubDesc, type: 'hub', section: '/image-size/', lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbsHub, c)],
      body: `${breadcrumbs(crumbsHub, c)}<h1>${esc(is.hubH1)}</h1><p class="lead">${esc(is.hubLead)}</p>
<div class="cards">${ext.IMG_PLATFORMS.map((p) => `<a class="card" href="${url(lang, '/image-size/' + p.id + '/')}"><span class="card-t">${esc(lang === 'zh' ? p.zh : p.en)}</span><span class="card-d">${p.presets.map((x) => `${x.w}×${x.h} ≤${x.mb}MB`).join(' · ')}</span></a>`).join('')}</div>
<p class="muted small">${esc(caveat)}</p>
<p><a class="btn primary" href="${url(lang, '/tools/image-resizer-for-marketplaces/')}">${esc(is.useTool)}</a></p>`,
    });
    for (const p of ext.IMG_PLATFORMS) {
      const name = lang === 'zh' ? p.zh : p.en;
      const crumbs = [{ label: is.hubH1, path: '/image-size/' }, { label: name }];
      const rows = p.presets.map((x) => `<tr><td>${esc(lang === 'zh' ? x.zh : x.en)}</td><td><b>${x.w}×${x.h}</b> px</td><td>≤ ${x.mb} MB</td><td>${x.min} px</td><td>${esc(x.note[lang])}</td></tr>`).join('');
      const others = ext.IMG_PLATFORMS.filter((x) => x.id !== p.id);
      const faq = lang === 'zh' ? [
        { q: `${name} 的商品图应该多大？`, a: `参考值：${p.presets.map((x) => `${x.w}×${x.h} 像素（${x.zh}，≤${x.mb}MB）`).join('；')}。以${name}卖家后台为准。` },
        { q: '怎么一次输出多个平台的尺寸？', a: '在图片工具里勾选多个平台预设并放入图片，每张图会输出每个预设的精确尺寸，可打包 ZIP 下载。' },
      ] : [
        { q: `What size should ${name} product images be?`, a: `Reference values: ${p.presets.map((x) => `${x.w}×${x.h} px (${x.en}, ≤${x.mb} MB)`).join('; ')}. Always confirm in the ${name} seller dashboard.` },
        { q: 'How do I export several marketplace sizes at once?', a: 'Tick several presets in the image tool and drop your photos. Every image is rendered at each preset\'s exact size, and you can download a ZIP.' },
      ];
      const body = `${breadcrumbs(crumbs, c)}<h1>${esc(is.pageH1(name))}</h1>
<p class="lead">${esc(is.useToolLead)}</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr>${is.cols.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
<section class="band"><h2>${esc(is.useTool)}</h2><p><a class="btn primary" href="${url(lang, '/tools/image-resizer-for-marketplaces/')}?preset=${encodeURIComponent(p.presets[0].id)}" data-track="tool_cta" data-where="imagesize">${esc(is.useTool)}</a></p></section>
<section><h2>${esc(is.caveatH)}</h2><p>${esc(caveat)}</p></section>
${faqHtml(faq, c)}
<section><h2>${esc(is.otherH)}</h2><p class="chips">${others.map((o) => `<a class="chip" href="${url(lang, '/image-size/' + o.id + '/')}">${esc(lang === 'zh' ? o.zh : o.en)}</a>`).join('')}</p></section>`;
      pages.push({
        path: `/image-size/${p.id}/`, lang, title: is.pageTitle(name), desc: is.pageDesc(name), body, type: 'article', section: '/image-size/', lastmod: '2026-10-14',
        jsonld: [breadcrumbLd(crumbs, c), faqLd(faq)],
      });
    }
  }
  return pages;
}

function hsPages(ctx) {
  const pages = [];
  const { ext } = ctx;
  const byCh = new Map();
  for (const e of ext.HS_COMMON) {
    const ch = e[0].slice(0, 2);
    if (!byCh.has(ch)) byCh.set(ch, []);
    byCh.get(ch).push(e);
  }
  const fmt = (h) => `${h.slice(0, 4)}.${h.slice(4, 6)}`;
  // Chapters with only a handful of reference entries would be thin pages, so they get no page of their own:
  // their entries are listed on the hub instead and still reach the tool pages.
  const MIN_ROWS = 6;
  const hasPage = (chNo) => (byCh.get(chNo) || []).length >= MIN_ROWS;
  const rowHtml = (e, lang, h) => {
    const [hs6, zh, en, , note] = e;
    const [nzh, nen] = String(note || '').split('||');
    const n = lang === 'zh' ? (nzh || '') : (nen || nzh || '');
    const main = lang === 'zh' ? zh : en;
    const alt = lang === 'zh' ? en : zh;
    const usUrl = `${url(lang, '/tools/us-tariff-calculator/')}?hs=${hs6}`;
    const euUrl = `${url(lang, '/tools/eu-import-duty-vat-calculator/')}?hs=${hs6}`;
    return `<tr id="hs-${hs6}"><td><code>${fmt(hs6)}</code></td><td>${esc(main)}</td><td>${esc(alt)}</td><td>${esc(n)}</td><td class="nowrap"><a href="${usUrl}">${esc(h.us)}</a> · <a href="${euUrl}">${esc(h.eu)}</a></td></tr>`;
  };
  for (const lang of LANGS) {
    const u = ctx.ui[lang];
    const c = ctx2(ctx, lang);
    const h = u.hs;
    const crumbsHub = [{ label: h.hubH1 }];
    pages.push({
      path: '/hs-code/', lang, title: h.hubTitle, desc: h.hubDesc, type: 'hub', section: '/hs-code/', lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbsHub, c)],
      body: `${breadcrumbs(crumbsHub, c)}<h1>${esc(h.hubH1)}</h1><p class="lead">${esc(h.hubLead)}</p>
<p><a class="btn primary" href="${url(lang, '/tools/hs-code-lookup/')}">${esc(h.lookupTool)}</a></p>
<ul class="chap-list">${ext.HS_CHAPTERS.map((ch) => {
        const n = byCh.get(ch[0]) ? byCh.get(ch[0]).length : 0;
        const name = lang === 'zh' ? ch[1] : ch[2];
        if (hasPage(ch[0])) return `<li><a href="${url(lang, '/hs-code/chapter-' + ch[0] + '/')}"><b>${ch[0]}</b> ${esc(name)} <span class="muted small">(${n})</span></a></li>`;
        return n ? `<li><a href="#other-${ch[0]}"><b>${ch[0]}</b> ${esc(name)} <span class="muted small">(${n})</span></a></li>` : `<li class="muted"><b>${ch[0]}</b> ${esc(name)}</li>`;
      }).join('')}</ul>
<h2>${esc(h.otherH)}</h2><p class="muted">${esc(h.otherLead)}</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr>${h.cols.map((x) => `<th>${esc(x)}</th>`).join('')}<th></th></tr></thead><tbody>${ext.HS_CHAPTERS.filter((ch) => byCh.has(ch[0]) && !hasPage(ch[0])).map((ch) => (byCh.get(ch[0]) || []).map((e, i) => (i === 0 ? rowHtml(e, lang, h).replace('<tr id=', `<tr data-ch="${ch[0]}" id="other-${ch[0]}" data-id=`) : rowHtml(e, lang, h))).join('')).join('')}</tbody></table></div>
<p class="muted small">${esc(h.caveat)}</p>`,
    });
    for (const ch of ext.HS_CHAPTERS) {
      const items = byCh.get(ch[0]);
      if (!items || !hasPage(ch[0])) continue;
      const name = lang === 'zh' ? ch[1] : ch[2];
      const crumbs = [{ label: h.hubH1, path: '/hs-code/' }, { label: `${ch[0]} ${name}` }];
      const rows = items.map((e) => rowHtml(e, lang, h)).join('');
      const alts = [...byCh.keys()].filter((k) => k !== ch[0]).slice(0, 0);
      pages.push({
        path: `/hs-code/chapter-${ch[0]}/`, lang, title: h.chapTitle(ch[0], name), desc: h.chapDesc(ch[0], name), type: 'article', section: '/hs-code/', lastmod: '2026-10-14',
        jsonld: [breadcrumbLd(crumbs, c)],
        body: `${breadcrumbs(crumbs, c)}<h1>${esc(h.chapH1(ch[0], name))}</h1><p class="lead">${esc(lang === 'zh' ? ch[2] : ch[1])}</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr>${h.cols.map((x) => `<th>${esc(x)}</th>`).join('')}<th></th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="muted small">${esc(h.caveat)}</p>
<p><a class="btn primary" href="${url(lang, '/tools/hs-code-lookup/')}" data-track="tool_cta" data-where="hschapter">${esc(h.lookup)}</a></p>${alts.length ? '' : ''}`,
      });
    }
  }
  return pages;
}

function guidePages(ctx) {
  const pages = [];
  for (const lang of LANGS) {
    const u = ctx.ui[lang];
    const c = ctx2(ctx, lang);
    const g = u.guides;
    const crumbsHub = [{ label: g.hubH1 }];
    pages.push({
      path: '/guides/', lang, title: g.hubTitle, desc: g.hubDesc, type: 'hub', section: '/guides/', lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbsHub, c)],
      body: `${breadcrumbs(crumbsHub, c)}<h1>${esc(g.hubH1)}</h1><p class="lead">${esc(g.hubLead)}</p><div class="cards">${GUIDES.map((x) => `<a class="card" href="${url(lang, '/guides/' + x.slug + '/')}"><span class="card-t">${esc(x[lang].h1)}</span><span class="card-d">${esc(x[lang].lead)}</span></a>`).join('')}</div>`,
    });
    for (const x of GUIDES) {
      const gl = x[lang];
      const crumbs = [{ label: g.hubH1, path: '/guides/' }, { label: gl.h1 }];
      const tools = x.tools.map((s) => toolBySlug[s]).filter(Boolean);
      const body = `${breadcrumbs(crumbs, c)}<h1>${esc(gl.h1)}</h1><p class="lead">${esc(gl.lead)}</p>
<article class="prose">${gl.body}</article>
${faqHtml(gl.faq, c)}
<section class="related"><h2>${esc(u.common.related)}</h2><div class="cards">${tools.map((t) => toolCard(t, c)).join('')}</div></section>
${partnerBox(x.tools[0], c)}
<p class="muted small disclaimer">${esc(u.common.disclaimerShort)} ${esc(u.common.updated)}: ${esc(x.updated)}.</p>`;
      pages.push({
        path: `/guides/${x.slug}/`, lang, title: gl.title, desc: gl.desc, body, type: 'article', section: '/guides/', lastmod: x.updated,
        jsonld: [breadcrumbLd(crumbs, c), faqLd(gl.faq), { '@context': 'https://schema.org', '@type': 'Article', headline: gl.h1, description: gl.desc, dateModified: x.updated, inLanguage: lang === 'zh' ? 'zh-Hans' : 'en', author: { '@type': 'Organization', name: ctx.cfg.company } }],
      });
    }
  }
  return pages;
}

function policyPages(ctx) {
  return LANGS.map((lang) => {
    const u = ctx.ui[lang];
    const p = u.policy;
    const c = ctx2(ctx, lang);
    const d = ctx.policy;
    const crumbs = [{ label: p.h1 }];
    const tracked = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${p.col.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${d.tracked.map((r) => `<tr><td>${esc(r.area[lang])}</td><td>${r.usedBy.map((s) => `<a href="${url(lang, '/tools/' + s + '/')}">${esc(toolBySlug[s][lang].nav)}</a>`).join(', ')}</td><td>${esc(r.reviewed === 'live' ? (lang === 'zh' ? '实时' : 'Live') : r.reviewed)}</td></tr>`).join('')}</tbody></table></div>`;
    const updates = d.updates.slice().sort((a, b) => b.date.localeCompare(a.date)).map((x) => `<article class="update" id="${esc(x.id)}"><div class="muted small"><time datetime="${esc(x.date)}">${esc(x.date)}</time> · ${esc(x.region)}</div><h2>${esc(x.title[lang])}</h2><p>${esc(x.summary[lang])}</p>${x.source ? `<p class="small">${esc(p.sourceLabel)}: <a href="${esc(x.source.url)}" rel="noopener nofollow" target="_blank">${esc(x.source.label)}</a></p>` : ''}</article>`).join('');
    const body = `${breadcrumbs(crumbs, c)}<h1>${esc(p.h1)}</h1><p class="lead">${esc(p.lead)}</p>
<p><a class="btn primary" href="${url(lang, '/pricing/')}" data-track="pro_cta" data-where="policy">${esc(p.alertsCta)}</a></p>
${updates}
<section><h2>${esc(p.trackedH)}</h2>${tracked}<p class="muted small">${esc(p.disclaimer)}</p></section>`;
    return { path: '/policy-updates/', lang, title: p.title, desc: p.desc, body, type: 'hub', section: '/policy-updates/', lastmod: d.updates.map((x) => x.date).sort().pop(), jsonld: [breadcrumbLd(crumbs, c)] };
  });
}

function pricingPages(ctx) {
  const { cfg } = ctx;
  return LANGS.map((lang) => {
    const u = ctx.ui[lang];
    const p = u.pricing;
    const c = ctx2(ctx, lang);
    const fill = (s) => s.replace('{imgFiles}', cfg.free.imageFilesPerRun).replace('{imgPresets}', cfg.free.imagePresetsPerRun).replace('{rows}', cfg.free.bulkRows);
    const fillPro = (s) => s.replace('{rows}', cfg.pro.bulkRows.toLocaleString('en-US')).replace('{calls}', cfg.pro.apiMonthlyCalls.toLocaleString('en-US')).replace('{watch}', cfg.pro.watchlistCodes);
    const save = Math.round((1 - cfg.pricing.annual / (cfg.pricing.monthly * 12)) * 100);
    const money = (n) => `${cfg.pricing.currency === 'USD' ? '$' : cfg.pricing.currency + ' '}${n}`;
    const crumbs = [{ label: p.h1 }];
    const ready = !!cfg.paddle.clientToken && !!cfg.paddle.prices.monthly;
    const body = `${breadcrumbs(crumbs, c)}<h1>${esc(p.h1)}</h1><p class="lead">${esc(p.lead)}</p>
<div class="plans" data-pricing data-ready="${ready ? '1' : '0'}">
  <section class="plan"><h2>${esc(p.free)}</h2><p class="price">${money(0)}</p><ul>${p.freeList.map((x) => `<li>${esc(fill(x))}</li>`).join('')}</ul><p><a class="btn" href="${url(lang, '/tools/')}">${esc(u.home.toolsH)}</a></p></section>
  <section class="plan pro"><h2>${esc(p.pro)} <span class="tag-pro">${esc(u.common.proBadge)}</span></h2>
    <div class="billing" role="group"><label><input type="radio" name="bill" value="monthly" checked> ${esc(p.monthly)} <b>${money(cfg.pricing.monthly)}</b> ${esc(p.perMonth)}</label>
    <label><input type="radio" name="bill" value="annual"> ${esc(p.annual)} <b>${money(cfg.pricing.annual)}</b> ${esc(p.perYear)} <span class="tag-save">${esc(p.save.replace('{pct}', save))}</span></label></div>
    <ul>${p.proList.map((x) => `<li>${esc(fillPro(x))}</li>`).join('')}</ul>
    <p><button class="btn primary" id="buy" type="button" data-label-ready="${esc(p.cta)}" data-label-wait="${esc(p.ctaWait)}" data-label-current="${esc(p.ctaCurrent)}">${esc(ready ? p.cta : p.ctaWait)}</button></p>
    <div id="waitlist" hidden><h3>${esc(p.waitlistH)}</h3><p class="muted">${esc(p.waitlistLead)}</p>${quoteFormWaitlist(ctx, lang)}</div>
  </section>
</div>
<p class="muted small">${esc(p.taxNote)}</p>
${faqHtml(p.faq, c)}`;
    return {
      path: '/pricing/', lang, title: p.title, desc: p.desc, body, type: 'pricing', section: '/pricing/', scripts: ['/assets/site/pricing.js', '/assets/site/leads.js'], lastmod: '2026-10-14',
      jsonld: [breadcrumbLd(crumbs, c), faqLd(p.faq)],
    };
  });
}

// the waitlist reuses the lead endpoint with a smaller form
function quoteFormWaitlist(ctx, lang) {
  const f = ctx.ui[lang].quotes.form;
  const consent = f.consent.replace('{site}', ctx.cfg.brand);
  return `<form class="lead-form" data-lead-form data-category="pro-waitlist" data-src="pricing" novalidate>
  <label>${esc(f.email)} *<input name="email" type="email" autocomplete="email" required maxlength="200"></label>
  <input class="hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
  <label class="consent"><input name="consent" type="checkbox" required> <span>${esc(lang === 'zh' ? '我同意接收 Pro 开放通知邮件。' : 'I agree to receive an email when Pro opens.')} <a href="${url(lang, '/privacy/')}" target="_blank" rel="noopener">${esc(ctx.ui[lang].footer.privacy)}</a></span></label>
  <input type="hidden" name="name" value="waitlist"><input type="hidden" name="category" value="pro-waitlist"><input type="hidden" name="src" value="pricing"><input type="hidden" name="lang" value="${lang}">
  <p><button class="btn primary" type="submit">${esc(ctx.ui[lang].pricing.ctaWait)}</button> <span class="form-msg" role="status" aria-live="polite"></span></p>
</form>`;
}

function accountPages(ctx) {
  return LANGS.map((lang) => {
    const a = ctx.ui[lang].account;
    const c = ctx2(ctx, lang);
    const body = `<h1>${esc(a.h1)}</h1>
<div id="acct" data-labels='${esc(JSON.stringify(a))}'>
  <section id="acct-signin"><p class="lead">${esc(a.signinLead)}</p>
    <form id="login-form"><label>${esc(a.email)}<input type="email" name="email" required autocomplete="email" maxlength="200"></label> <button class="btn primary" type="submit">${esc(a.send)}</button> <span class="form-msg" role="status" aria-live="polite"></span></form></section>
  <section id="acct-main" hidden></section>
</div>`;
    return { path: '/account/', lang, title: a.title, desc: lang === 'zh' ? '登录你的 Pro 账户：管理订阅、API 密钥和政策提醒关注列表。' : 'Sign in to your Pro account to manage your subscription, API key and policy-alert watchlist.', body, type: 'account', noindex: true, section: '/account/', scripts: ['/assets/site/account.js'] };
  });
}

function bulkPages(ctx) {
  return LANGS.map((lang) => {
    const b = ctx.ui[lang].bulk;
    const c = ctx2(ctx, lang);
    const crumbs = [{ label: b.h1 }];
    const body = `${breadcrumbs(crumbs, c)}<h1>${esc(b.h1)}</h1><p class="lead">${esc(b.lead)}</p>
<section id="bulk" data-labels='${esc(JSON.stringify(b))}'><div class="loading">…</div><noscript><p class="warn">${esc(ctx.ui[lang].common.noscript)}</p></noscript></section>
${proStrip(c, lang === 'zh' ? 'Pro 最多处理 5,000 行并支持 CSV 导出。' : 'Pro processes up to 5,000 rows and exports CSV.')}`;
    return { path: '/pro/bulk/', lang, title: b.title, desc: b.desc, body, type: 'bulk', section: '/pro/bulk/', scripts: ['/assets/site/bulk.js'], lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbs, c)] };
  });
}

function docsPages(ctx) {
  return LANGS.map((lang) => {
    const d = ctx.ui[lang].docs;
    const c = ctx2(ctx, lang);
    const crumbs = [{ label: d.h1 }];
    const base = ctx.cfg.siteUrl + '/api/v1';
    const ex = (s) => `<pre><code>${esc(s)}</code></pre>`;
    const body = `${breadcrumbs(crumbs, c)}<h1>${esc(d.h1)}</h1><p class="lead">${esc(d.lead)}</p>
<article class="prose">
<h2>${lang === 'zh' ? '认证' : 'Authentication'}</h2>
<p>${lang === 'zh' ? '在账户页生成 API Key，并作为 Bearer token 发送：' : 'Create an API key on your account page and send it as a Bearer token:'}</p>
${ex(`curl -H "Authorization: Bearer YOUR_KEY" "${base}/volumetric?l=40&w=30&h=20&divisor=5000&actual=3.2"`)}
<h2>${lang === 'zh' ? '限额' : 'Limits'}</h2>
<p>${lang === 'zh' ? `每月 ${ctx.cfg.pro.apiMonthlyCalls.toLocaleString('en-US')} 次调用，每分钟 ${ctx.cfg.pro.apiPerMinute} 次。响应头包含 X-RateLimit-Remaining-Month。超限返回 429。` : `${ctx.cfg.pro.apiMonthlyCalls.toLocaleString('en-US')} calls per month and ${ctx.cfg.pro.apiPerMinute} per minute. Responses include X-RateLimit-Remaining-Month. Over the limit returns 429.`}</p>
<h2>GET /api/v1/volumetric</h2>
<p>l, w, h (cm), divisor (default 5000), actual (kg, optional), qty (default 1).</p>
${ex(`{"volumetricKg":4.8,"actualKg":3.2,"chargeableKg":4.8,"divisor":5000,"qty":1}`)}
<h2>GET /api/v1/rates</h2>
<p>base (default USD), symbols (comma list, optional), amount (optional).</p>
${ex(`{"base":"USD","date":"2026-10-12","rates":{"CNY":6.70582,"EUR":0.895156}}`)}
<h2>GET /api/v1/hs/search</h2>
<p>q (English or Chinese product name), limit (default 10).</p>
${ex(`{"query":"headphones","results":[{"hs6":"851830","code":"8518.30","zh":"耳机 / 蓝牙耳机","en":"Headphones and earphones","note":"…"}]}`)}
<h2>GET /api/v1/tariff/us</h2>
<p>hts (6–10 digits), origin (ISO alpha-2), value (USD, optional).</p>
${ex(`{"hts":"8517.13.00.00","origin":"CN","baseRatePct":0,"legacy301Pct":0,"new301Pct":12.5,"totalPct":12.5,"estimatedDuty":125,"asOf":"2026-07-24","notes":["Ad-valorem estimate only…"]}`)}
<h2>GET /api/v1/eu/landed-cost</h2>
<p>goods, shipping, dutyPct, country (EU alpha-2), lowValue (true/false).</p>
${ex(`{"country":"DE","vatPct":19,"duty":44,"vat":217.36,"landedCost":1361.36}`)}
<h2>${lang === 'zh' ? '说明' : 'Notes'}</h2>
<p>${lang === 'zh' ? '结果为参考估算，字段会随规则更新而扩展；请忽略未知字段。' : 'Results are reference estimates. Fields may be added as rules evolve; ignore unknown fields.'}</p>
</article>`;
    return { path: '/docs/api/', lang, title: d.title, desc: d.desc, body, type: 'docs', section: '/docs/api/', lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbs, c)] };
  });
}

function quotePages(ctx) {
  const pages = [];
  for (const lang of LANGS) {
    const u = ctx.ui[lang];
    const q = u.quotes;
    const c = ctx2(ctx, lang);
    const cats = Object.entries(ctx.partners.categories);
    const crumbsHub = [{ label: q.hubH1 }];
    pages.push({
      path: '/get-quotes/', lang, title: q.hubTitle, desc: q.hubDesc, type: 'hub', section: '/get-quotes/', lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbsHub, c)],
      body: `${breadcrumbs(crumbsHub, c)}<h1>${esc(q.hubH1)}</h1><p class="lead">${esc(q.hubLead)}</p>
<div class="cards">${cats.map(([id, cat]) => `<a class="card" href="${url(lang, '/get-quotes/' + cat.slug + '/')}"><span class="card-t">${esc(cat.name[lang])}</span><span class="card-d">${esc(cat.pitch[lang])}</span></a>`).join('')}</div>
<p class="muted small">${esc(u.common.adNote)} <a href="${url(lang, '/affiliate-disclosure/')}">${esc(u.footer.affiliate)}</a></p>`,
    });
    for (const [id, cat] of cats) {
      const crumbs = [{ label: q.hubH1, path: '/get-quotes/' }, { label: cat.name[lang] }];
      const real = (cat.partners || []).filter((p) => p.url);
      const body = `${breadcrumbs(crumbs, c)}<h1>${esc(cat.name[lang])}</h1><p class="lead">${esc(cat.pitch[lang])}</p>
${real.length ? `<section><h2>${esc(q.partnersH)}</h2><ul class="pbox-partners">${real.map((p) => partnerLink(p, 'quotes-' + cat.slug, c)).join('')}</ul><p class="muted small">${esc(q.partnersNote)}</p></section>` : ''}
<section><h2>${esc(cat.cta[lang])}</h2>${quoteForm(id, c)}</section>
<p class="muted small">${esc(u.common.adNote)} <a href="${url(lang, '/affiliate-disclosure/')}">${esc(u.footer.affiliate)}</a></p>`;
      pages.push({
        path: `/get-quotes/${cat.slug}/`, lang, title: q.catTitle(cat.name[lang]), desc: q.catDesc(cat.name[lang]), body, type: 'quote', section: '/get-quotes/', scripts: ['/assets/site/leads.js'], lastmod: '2026-10-14',
        jsonld: [breadcrumbLd(crumbs, c)],
      });
    }
  }
  return pages;
}

function legalPages(ctx) {
  const pages = [];
  for (const lang of LANGS) {
    const c = ctx2(ctx, lang);
    for (const [key, v] of Object.entries(LEGAL)) {
      const l = v[lang];
      const crumbs = [{ label: l.title }];
      pages.push({
        path: `/${key}/`, lang, title: `${l.title} | ${ctx.cfg.brand}`, desc: l.desc, type: 'legal', section: `/${key}/`, lastmod: '2026-10-14', jsonld: [breadcrumbLd(crumbs, c)],
        body: `${breadcrumbs(crumbs, c)}<h1>${esc(l.title)}</h1><p class="muted small">${esc(ctx.ui[lang].legal.updated)}: 2026-10-14</p><article class="prose">${l.body}</article>`,
      });
    }
  }
  return pages;
}

export async function buildPages(ctx) {
  ctx.ext = await loadExtData(ctx.extDir);
  return [
    ...homePages(ctx), ...toolsHub(ctx), ...toolPages(ctx), ...imageSizePages(ctx), ...hsPages(ctx), ...guidePages(ctx),
    ...policyPages(ctx), ...pricingPages(ctx), ...accountPages(ctx), ...bulkPages(ctx), ...docsPages(ctx), ...quotePages(ctx), ...legalPages(ctx),
  ];
}
