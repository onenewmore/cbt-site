// Reusable HTML components: partner boxes, quote form, Pro strips, tool cards.
import { esc, url } from './core.mjs';

export function partnerCats(cfgPartners, slug) {
  return (cfgPartners.toolMap[slug] || []).map((id) => ({ id, ...cfgPartners.categories[id] }));
}

// Contextual "next step" box under a tool. Always shows a quote CTA; lists real partners only if configured.
export function partnerBox(slug, ctx) {
  const { lang, ui, partners } = ctx;
  const q = ui[lang].quotes;
  const cats = partnerCats(partners, slug);
  if (!cats.length) return '';
  const cards = cats.map((c) => {
    const real = (c.partners || []).filter((p) => p.url);
    return `<div class="pbox-card">
      <h3>${esc(c.name[lang])}</h3>
      <p>${esc(c.pitch[lang])}</p>
      <p><a class="btn primary" href="${url(lang, '/get-quotes/' + c.slug + '/')}?src=${encodeURIComponent(slug)}" data-track="quote_cta" data-cat="${esc(c.id)}" data-src="${esc(slug)}">${esc(c.cta[lang])}</a></p>
      ${real.length ? `<ul class="pbox-partners">${real.map((p) => partnerLink(p, slug, ctx)).join('')}</ul>` : ''}
    </div>`;
  }).join('');
  return `<aside class="pbox" aria-label="${esc(q.toolBoxH)}">
    <div class="pbox-h"><b>${esc(q.toolBoxH)}</b><span class="muted small"> · ${esc(q.toolBoxLead)}</span></div>
    <div class="pbox-grid">${cards}</div>
    <p class="muted small pbox-note">${esc(ui[lang].common.adNote.replace(/\.$/, ''))}. <a href="${url(lang, '/affiliate-disclosure/')}">${esc(ui[lang].footer.affiliate)}</a></p>
  </aside>`;
}

export function partnerLink(p, src, ctx) {
  const { lang, ui } = ctx;
  return `<li><span class="tag-spons">${esc(ui[lang].common.sponsored)}</span> <a href="/go/${encodeURIComponent(p.id)}?src=${encodeURIComponent(src)}" rel="sponsored nofollow noopener" target="_blank" data-track="affiliate_click" data-partner="${esc(p.id)}" data-src="${esc(src)}"><b>${esc(p.name)}</b></a>${p.blurb ? ` — ${esc(p.blurb[lang] || '')}` : ''}${p.disclosure ? `<br><span class="muted small">${esc(p.disclosure[lang] || '')}</span>` : ''}</li>`;
}

export function quoteForm(category, ctx, { src = '' } = {}) {
  const { lang, ui, cfg } = ctx;
  const f = ui[lang].quotes.form;
  const consent = f.consent.replace('{site}', cfg.brand);
  return `<form class="lead-form" data-lead-form data-category="${esc(category)}" data-src="${esc(src)}" novalidate>
  <div class="grid2">
    <label>${esc(f.name)} *<input name="name" type="text" autocomplete="name" required maxlength="120"></label>
    <label>${esc(f.email)} *<input name="email" type="email" autocomplete="email" required maxlength="200"></label>
    <label>${esc(f.company)}<input name="company" type="text" autocomplete="organization" maxlength="160"></label>
    <label>${esc(f.route)}<input name="route" type="text" maxlength="200" placeholder="Shenzhen → Los Angeles"></label>
    <label>${esc(f.cargo)}<input name="cargo" type="text" maxlength="300"></label>
    <label>${esc(f.volume)}<input name="volume" type="text" maxlength="120" placeholder="e.g. 20 CBM / 500 parcels"></label>
  </div>
  <label>${esc(f.details)}<textarea name="details" rows="3" maxlength="1500"></textarea></label>
  <input class="hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
  <label class="consent"><input name="consent" type="checkbox" required> <span>${esc(consent)} <a href="${url(lang, '/privacy/')}" target="_blank" rel="noopener">${esc(ui[lang].footer.privacy)}</a></span></label>
  ${ctx.cfg.turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${esc(ctx.cfg.turnstileSiteKey)}"></div>` : ''}
  <p><button class="btn primary" type="submit">${esc(f.submit)}</button> <span class="form-msg" role="status" aria-live="polite"></span></p>
  <input type="hidden" name="category" value="${esc(category)}">
  <input type="hidden" name="src" value="${esc(src)}">
  <input type="hidden" name="lang" value="${esc(lang)}">
</form>`;
}

export function proStrip(ctx, text) {
  const { lang, ui } = ctx;
  return `<div class="pro-strip" data-pro-strip><span class="tag-pro">${esc(ui[lang].common.proBadge)}</span> ${esc(text)} <a href="${url(lang, '/pricing/')}" data-track="pro_cta" data-where="strip">${esc(ui[lang].home.proCta)}</a></div>`;
}

export function toolCard(t, ctx) {
  const { lang } = ctx;
  return `<a class="card tool-card-link" href="${url(lang, '/tools/' + t.slug + '/')}">
    <span class="card-ico" aria-hidden="true">${t.icon}</span>
    <span class="card-t">${esc(t[lang].nav)}</span>
    <span class="card-d">${esc(t[lang].lead)}</span>
  </a>`;
}
