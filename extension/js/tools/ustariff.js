import { t, registerMessages, getLang } from '../i18n.js';
import { esc, debounce } from '../dom.js';
import { htsSearch, htsLink } from '../hts.js';
import { takePending } from '../bus.js';
import { COUNTRIES, countryName } from '../data/countries.js';
import { US_RULES } from '../data/rules.js';
import {
  parseDuty, parseChapter99Add, formatHts, extract99Refs, pickHtsItem, newSection301, fmt, round2,
} from '../calc.js';
import { get, set } from '../store.js';

registerMessages({
  zh: {
    'us.title': '美国关税查询',
    'us.hs': '海关编码',
    'us.hsPh': '请输入海关编码（HTS，6–10 位）',
    'us.origin': '原产国',
    'us.value': '货值 (USD)',
    'us.manual': '手动加征税率 %',
    'us.manualHint': '原产国不在内置名单、或需覆盖新增 301 税率时填写',
    'us.query': '查询',
    'us.base': '基础税率',
    'us.baseNtr': '基础税率（非正常贸易关系 Column 2）',
    'us.legacy301': '301条款加征税率（中国旧清单）',
    'us.new301': '2026新增301加征税率',
    'us.other99': '其他 Chapter 99 条款',
    'us.total': '总税率',
    'us.detail': '查看详情',
    'us.duty': '预估关税',
    'us.notChina': '仅中国大陆原产适用',
    'us.noRef': '该编码未关联 301 清单',
    'us.unknownOrigin': '该原产国不在内置名单，请手动填写或查官方公告',
    'us.cap10': '税率上限规则：MFN + 301 合计不超过 10%',
    'us.cap125': '税率上限规则：MFN + 301 合计不超过 12.5%',
    'us.specific': '含从量税（如 $/kg），总税率仅含从价部分，实际税额请以海关为准',
    'us.pick': '该前缀下的税号（点击选择）',
    'us.shortCode': '请至少输入 6 位海关编码',
    'us.notFound': '未在 USITC HTS 中找到该编码，请检查位数后重试',
    'us.exempt': '新 301 有大量豁免（如已适用 232 的钢铝铜、汽车及零部件、符合 USMCA 的加拿大/墨西哥货物、部分农产品和能源等），请对照官方附件确认。',
    'us.s232': '该编码关联 232 条款（{refs}），新 301 通常不再叠加，请核对官方说明。',
    'us.ieepa': '2025 年的 IEEPA（芬太尼 / 对等关税）已于 2026-02-24 终止（最高法院 2026-02-20 裁决），所以本工具不再显示“2025总加征税率”。临时的 Section 122 10% 附加税已于 2026-07-24 到期，被新的 Section 301 取代。',
    'us.asOf': '规则更新至 {d}；数据来源',
    'us.note': '基础税率与 301 条款来自美国国际贸易委员会 (USITC) HTS 官方接口，结果仅供参考，不构成报关意见；反倾销/反补贴税、232 等另计。',
    'us.fixRate': '无法解析',
  },
  en: {
    'us.title': 'US Tariff Lookup',
    'us.hs': 'HTS code',
    'us.hsPh': 'Enter an HTS code (6–10 digits)',
    'us.origin': 'Origin',
    'us.value': 'Goods value (USD)',
    'us.manual': 'Manual extra rate %',
    'us.manualHint': 'Use when the origin is not in the built-in list, or to override the new 301 rate',
    'us.query': 'Search',
    'us.base': 'Base rate (MFN / general)',
    'us.baseNtr': 'Base rate (non-NTR, Column 2)',
    'us.legacy301': 'Section 301 (legacy China lists)',
    'us.new301': 'New Section 301 (2026)',
    'us.other99': 'Other Chapter 99 provisions',
    'us.total': 'Total rate',
    'us.detail': 'Details',
    'us.duty': 'Estimated duty',
    'us.notChina': 'Applies to China-origin goods only',
    'us.noRef': 'This code is not linked to a 301 list',
    'us.unknownOrigin': 'Origin not in the built-in list — enter a manual rate or check the official notice',
    'us.cap10': 'Cap rule: MFN + 301 combined ≤ 10%',
    'us.cap125': 'Cap rule: MFN + 301 combined ≤ 12.5%',
    'us.specific': 'Includes a specific (per-unit) duty. The total only covers the ad-valorem part; confirm the real amount with customs.',
    'us.pick': 'Tariff lines under this prefix (click to select)',
    'us.shortCode': 'Please enter at least 6 digits',
    'us.notFound': 'Code not found in the USITC HTS. Check the digits and try again.',
    'us.exempt': 'The new 301 has many exemptions (goods already under Section 232 such as steel/aluminum/copper, autos and parts, USMCA-qualifying goods from Canada/Mexico, some agricultural and energy products…). Check the official annexes.',
    'us.s232': 'This code is linked to Section 232 provisions ({refs}); the new 301 normally does not stack. Please verify.',
    'us.ieepa': 'The 2025 IEEPA tariffs (fentanyl / reciprocal) ended on 2026-02-24 after the Supreme Court ruling of 2026-02-20, so a "2025 additional tariff" is no longer shown. The temporary 10% Section 122 surcharge expired on 2026-07-24 and was replaced by the new Section 301 duties.',
    'us.asOf': 'Rules as of {d}; source',
    'us.note': 'Base rates and legacy 301 lines come from the official USITC HTS API. For reference only — not customs advice. AD/CVD, Section 232 and other duties are separate.',
    'us.fixRate': 'could not parse',
  },
});

const ch99Cache = new Map();

async function chapter99Rate(ref) {
  if (ch99Cache.has(ref)) return ch99Cache.get(ref);
  let out = { ref, add: null, text: '' };
  try {
    const items = await htsSearch(ref);
    const it = items.find((x) => String(x.htsno || '').replace(/\D/g, '') === ref.replace(/\D/g, ''));
    if (it) out = { ref, add: parseChapter99Add(it.general), text: (it.description || '').slice(0, 140) };
  } catch { /* leave unknown */ }
  ch99Cache.set(ref, out);
  return out;
}

const pct = (n) => `${fmt(round2(n))}%`;

export default {
  id: 'ustariff',
  titleKey: 'nav.ustariff',
  async mount(el) {
    const saved = await get('usState', { origin: 'CN' });
    const lang = getLang();
    const collator = new Intl.Collator(lang === 'zh' ? 'zh-Hans-CN-u-co-pinyin' : 'en');
    const countries = COUNTRIES.map((c) => ({ a2: c.a2, name: countryName(c.a2, lang) })).sort((a, b) => collator.compare(a.name, b.name));

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('us.title'))} <span class="help" title="${esc(t('us.note'))}">?</span></h2>
      <div class="pad">
        <div class="notice">${esc(t('us.ieepa'))}</div>
        <div class="form">
          <div class="form-row"><label>${esc(t('us.hs'))}</label>
            <input id="us-hs" type="text" inputmode="numeric" placeholder="${esc(t('us.hsPh'))}" style="width:260px">
            <button class="btn primary" id="us-go">${esc(t('us.query'))}</button></div>
          <div class="form-row"><label>${esc(t('us.origin'))}</label>
            <select id="us-origin">${countries.map((c) => `<option value="${c.a2}">${esc(c.name)} (${c.a2})</option>`).join('')}</select></div>
          <div class="form-row"><label>${esc(t('us.value'))}</label>
            <input id="us-val" type="number" min="0" step="any" placeholder="${esc(t('common.optional'))}">
            <label class="inline-label">${esc(t('us.manual'))}</label>
            <input id="us-man" type="number" min="0" step="any" style="width:90px" title="${esc(t('us.manualHint'))}"></div>
        </div>
        <div id="us-out"></div>
        <div class="muted small foot">${esc(t('us.asOf', { d: US_RULES.asOf }))}: <a href="${esc(US_RULES.sourceUrl)}" target="_blank" rel="noopener">Morgan Lewis</a></div>
      </div>`;

    const $ = (id) => el.querySelector('#' + id);
    $('us-origin').value = saved.origin;

    function row(label, valueHtml, extraHtml = '') {
      return `<div class="res-row"><div class="res-label">${esc(label)}</div><div class="res-val">${valueHtml}</div><div class="res-extra">${extraHtml}</div></div>`;
    }

    async function run(codeOverride) {
      const out = $('us-out');
      const digits = String(codeOverride || $('us-hs').value).replace(/\D/g, '');
      const origin = $('us-origin').value;
      set('usState', { origin });
      if (digits.length < 6) { out.innerHTML = `<div class="warn">${esc(t('us.shortCode'))}</div>`; return; }
      if (digits.length > 10) { $('us-hs').value = digits.slice(0, 10); return run(digits.slice(0, 10)); }
      out.innerHTML = `<div class="muted">${esc(t('common.loading'))}</div>`;
      try {
        const kw = digits.length >= 8 ? formatHts(digits.slice(0, 8)) : formatHts(digits);
        const results = await htsSearch(kw);
        const picked = pickHtsItem(results, digits);

        if (!picked.item) {
          if (picked.list.length) {
            out.innerHTML = `<div class="section-title small">${esc(t('us.pick'))}</div><div class="pick-list">${picked.list.slice(0, 40).map((r) => `
              <button class="pick" data-code="${esc(String(r.htsno).replace(/\D/g, ''))}"><b>${esc(r.htsno)}</b> <span>${esc((r.description || '').replace(/<[^>]+>/g, ''))}</span> <i>${esc(r.general || '')}</i></button>`).join('')}</div>`;
          } else {
            out.innerHTML = `<div class="warn">${esc(t('us.notFound'))}</div>`;
          }
          return;
        }

        const item = picked.item;
        const nonNtr = US_RULES.nonNtr.includes(origin);
        const baseText = nonNtr ? (item.other || item.general) : item.general;
        const base = parseDuty(baseText);
        const code = item.htsno;

        const refs = [...new Set([item, ...picked.ancestors].flatMap(extract99Refs))];
        const s301Refs = refs.filter((r) => /^9903\.(88|91)\./.test(r));
        const s232Refs = refs.filter((r) => /^9903\.(7[89]|8[0-5]|94)\./.test(r));
        const otherRefs = refs.filter((r) => !s301Refs.includes(r));
        const s301Rates = await Promise.all(s301Refs.slice(0, 8).map(chapter99Rate));

        // legacy 301 (China lists): take the highest rate that was found
        const found = s301Rates.filter((r) => r.add !== null && r.add > 0);
        const legacy = origin === 'CN' && found.length ? Math.max(...found.map((r) => r.add)) : 0;

        // new 2026 301
        const manual = parseFloat($('us-man').value);
        const auto = newSection301(origin, base.pct, US_RULES);
        let newRate = auto.rate;
        if (isFinite(manual)) newRate = manual;
        const newUnknown = newRate === null;

        const total = (base.pct ?? 0) + legacy + (newRate ?? 0);
        const goods = parseFloat($('us-val').value);

        const baseHtml = base.text ? `<b>${esc(base.text)}</b>` : '--';
        const legacyHtml = origin !== 'CN'
          ? `<span class="muted">${esc(s301Refs.length ? t('us.notChina') : '--')}</span>`
          : (s301Refs.length
            ? s301Rates.map((r) => `<span class="chip"><a href="${htsLink(r.ref)}" target="_blank" rel="noopener">${esc(r.ref)}</a> ${r.add !== null ? '+' + esc(String(r.add)) + '%' : '<i>' + esc(t('us.fixRate')) + '</i>'}</span>`).join(' ') + ` → <b>${esc(pct(legacy))}</b>`
            : `<span class="muted">${esc(t('us.noRef'))}</span> <b>0%</b>`);
        let newHtml;
        if (newUnknown) newHtml = `<span class="warn-text">${esc(t('us.unknownOrigin'))}</span>`;
        else {
          const basisNote = isFinite(manual) ? '' : (auto.basis === 'cap10' ? t('us.cap10') : auto.basis === 'cap125' ? t('us.cap125') : '');
          newHtml = `<b>${esc(pct(newRate))}</b>${basisNote ? ` <span class="muted small">${esc(basisNote)}</span>` : ''}`;
        }

        let html = '<div class="results">';
        html += row(nonNtr ? t('us.baseNtr') : t('us.base'), baseHtml, `<a href="${htsLink(code)}" target="_blank" rel="noopener">${esc(t('us.detail'))}</a>`);
        html += row(t('us.legacy301'), legacyHtml);
        html += row(t('us.new301'), newHtml, `<a href="${esc(US_RULES.sourceUrl)}" target="_blank" rel="noopener">${esc(t('us.detail'))}</a>`);
        if (otherRefs.length) {
          html += row(t('us.other99'), otherRefs.slice(0, 8).map((r) => `<a class="chip" href="${htsLink(r)}" target="_blank" rel="noopener">${esc(r)}</a>`).join(' '));
        }
        html += row(t('us.total'), `<span class="total">${esc(pct(total))}${newUnknown ? ' +?' : ''}</span>`);
        if (isFinite(goods) && goods > 0) {
          html += row(t('us.duty'), `<b>$${esc(fmt(round2((goods * total) / 100)))}</b>`);
        }
        html += '</div>';
        html += `<div class="desc-line"><b>${esc(code)}</b> ${esc((item.description || '').replace(/<[^>]+>/g, ''))}</div>`;
        if (base.specific) html += `<div class="warn">${esc(t('us.specific'))}</div>`;
        if (s232Refs.length) html += `<div class="warn">${esc(t('us.s232', { refs: s232Refs.join(', ') }))}</div>`;
        html += `<div class="muted small">${esc(t('us.exempt'))}</div>`;
        out.innerHTML = html;
      } catch (e) {
        out.innerHTML = `<div class="warn">${esc(t('common.netError'))}</div>`;
      }
    }

    $('us-go').addEventListener('click', () => run());
    $('us-hs').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    $('us-origin').addEventListener('change', () => { if ($('us-hs').value) run(); else set('usState', { origin: $('us-origin').value }); });
    const rerun = debounce(() => { if ($('us-hs').value) run(); }, 350);
    $('us-val').addEventListener('input', rerun);
    $('us-man').addEventListener('input', rerun);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.pick');
      if (b) { $('us-hs').value = b.dataset.code; run(b.dataset.code); }
    });
    const pend = takePending('ustariff');
    if (pend && pend.hs) { $('us-hs').value = pend.hs; run(pend.hs); } else $('us-hs').focus();
  },
};
