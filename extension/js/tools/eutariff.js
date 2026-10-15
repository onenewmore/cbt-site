import { t, registerMessages, getLang } from '../i18n.js';
import { esc } from '../dom.js';
import { COUNTRIES, EU27, countryName } from '../data/countries.js';
import { EU_VAT, EU_VAT_ASOF, EU_LOW_VALUE } from '../data/rules.js';
import { euLandedCost, fmt, round2, pad2 } from '../calc.js';
import { get, set } from '../store.js';
import { takePending } from '../bus.js';

registerMessages({
  zh: {
    'eu.title': '欧盟关税查询',
    'eu.hs': '海关编码',
    'eu.hsPh': '请输入海关编码（CN/TARIC，6–10 位）',
    'eu.origin': '原产国',
    'eu.dest': '目的国',
    'eu.taric': '打开 TARIC 官方查询',
    'eu.a2m': '打开 Access2Markets',
    'eu.officialNote': '欧盟没有稳定的公开税率接口，因此这里直接跳转到欧盟委员会官方系统，并自动带入编码和原产国（官方页面会显示进口税率、反倾销及其他措施）；下方可用查到的税率估算到岸成本。',
    'eu.est': '到岸成本估算',
    'eu.goods': '货值 (EUR)',
    'eu.ship': '运费+保险 (EUR)',
    'eu.dutyRate': '关税税率 %',
    'eu.dutyHint': '填入在 TARIC / Access2Markets 查到的第三国税率',
    'eu.vat': '进口增值税 %',
    'eu.vatHint': '标准税率，仅供参考，可手动修改',
    'eu.low': 'B2C 低价包裹（≤ €150，经 IOSS 申报）',
    'eu.lines': '税号条目数',
    'eu.lowNote': '自 {d} 起，欧盟对 €150 以下的 B2C 包裹按“每个税号条目固定 €3”征收关税（过渡措施，取代原来的免税），增值税另计。具体以海关和欧盟委员会最新指引为准。',
    'eu.lowOver': '货值超过 €150，按正常关税税率计算。',
    'eu.customsValue': '完税价格 (CIF)',
    'eu.duty': '关税',
    'eu.dutyFlat': '关税（固定 €3 × 条目数）',
    'eu.vatAmt': '进口增值税',
    'eu.total': '到岸总成本',
    'eu.vatNote': '增值税标准税率截至 {d}，仅供参考；部分商品适用减免税率。',
    'eu.calc': '估算结果',
  },
  en: {
    'eu.title': 'EU Tariff Lookup',
    'eu.hs': 'Commodity code',
    'eu.hsPh': 'Enter a CN / TARIC code (6–10 digits)',
    'eu.origin': 'Origin',
    'eu.dest': 'Destination',
    'eu.taric': 'Open TARIC (official)',
    'eu.a2m': 'Open Access2Markets',
    'eu.officialNote': 'The EU has no stable public tariff API, so this opens the European Commission\'s official systems with your code and origin pre-filled (they show import duty, anti-dumping and other measures). Use the rate you find below to estimate landed cost.',
    'eu.est': 'Landed cost estimate',
    'eu.goods': 'Goods value (EUR)',
    'eu.ship': 'Freight + insurance (EUR)',
    'eu.dutyRate': 'Duty rate %',
    'eu.dutyHint': 'Enter the third-country rate found in TARIC / Access2Markets',
    'eu.vat': 'Import VAT %',
    'eu.vatHint': 'Standard rate, for reference. You can edit it.',
    'eu.low': 'Low-value B2C parcel (≤ €150, declared via IOSS)',
    'eu.lines': 'Tariff lines',
    'eu.lowNote': 'Since {d}, the EU charges a flat €3 customs duty per tariff line on B2C parcels under €150 (a temporary measure replacing the old duty-free treatment). VAT is separate. Check the latest customs / Commission guidance.',
    'eu.lowOver': 'Goods value exceeds €150 — the normal duty rate is used.',
    'eu.customsValue': 'Customs value (CIF)',
    'eu.duty': 'Customs duty',
    'eu.dutyFlat': 'Customs duty (flat €3 × lines)',
    'eu.vatAmt': 'Import VAT',
    'eu.total': 'Total landed cost',
    'eu.vatNote': 'Standard VAT rates as of {d}, for reference; reduced rates may apply to some goods.',
    'eu.calc': 'Estimate',
  },
});

const todayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
};

const eur = (n) => `€${fmt(round2(n))}`;

export default {
  id: 'eutariff',
  titleKey: 'nav.eutariff',
  async mount(el) {
    const saved = await get('euState', { origin: 'CN', dest: 'DE' });
    const lang = getLang();
    const collator = new Intl.Collator(lang === 'zh' ? 'zh-Hans-CN-u-co-pinyin' : 'en');
    const all = COUNTRIES.map((c) => ({ a2: c.a2, name: countryName(c.a2, lang) })).sort((a, b) => collator.compare(a.name, b.name));
    const eu = EU27.map((a2) => ({ a2, name: countryName(a2, lang) })).sort((a, b) => collator.compare(a.name, b.name));

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('eu.title'))}</h2>
      <div class="pad">
        <div class="notice">${esc(t('eu.officialNote'))}</div>
        <div class="form">
          <div class="form-row"><label>${esc(t('eu.hs'))}</label>
            <input id="eu-hs" type="text" inputmode="numeric" placeholder="${esc(t('eu.hsPh'))}" style="width:280px"></div>
          <div class="form-row"><label>${esc(t('eu.origin'))}</label>
            <select id="eu-origin">${all.map((c) => `<option value="${c.a2}">${esc(c.name)} (${c.a2})</option>`).join('')}</select></div>
          <div class="form-row"><label>${esc(t('eu.dest'))}</label>
            <select id="eu-dest">${eu.map((c) => `<option value="${c.a2}">${esc(c.name)} (${c.a2})</option>`).join('')}</select></div>
          <div class="form-row"><label></label>
            <a class="btn primary" id="eu-taric" target="_blank" rel="noopener">${esc(t('eu.taric'))}</a>
            <a class="btn" id="eu-a2m" target="_blank" rel="noopener">${esc(t('eu.a2m'))}</a></div>
        </div>

        <h3 class="section-title">${esc(t('eu.est'))}</h3>
        <div class="fields">
          <div class="field"><label>${esc(t('eu.goods'))}</label><input id="eu-goods" type="number" min="0" step="any"></div>
          <div class="field"><label>${esc(t('eu.ship'))}</label><input id="eu-ship" type="number" min="0" step="any" value="0"></div>
          <div class="field"><label>${esc(t('eu.dutyRate'))}</label><input id="eu-rate" type="number" min="0" step="any" value="0"></div>
          <div class="field"><label>${esc(t('eu.vat'))}</label><input id="eu-vat" type="number" min="0" step="any"></div>
        </div>
        <div class="muted small" style="margin:4px 0 8px">${esc(t('eu.dutyHint'))} · ${esc(t('eu.vatHint'))}</div>
        <div class="check-line">
          <label class="check"><input id="eu-low" type="checkbox"> ${esc(t('eu.low'))}</label>
          <span id="eu-lines-row" hidden>${esc(t('eu.lines'))} <input id="eu-lines" type="number" min="1" step="1" value="1" style="width:64px"></span>
        </div>
        <div class="muted small" id="eu-lownote" hidden>${esc(t('eu.lowNote', { d: EU_LOW_VALUE.from }))}</div>
        <div id="eu-out"></div>
        <div class="muted small foot">${esc(t('eu.vatNote', { d: EU_VAT_ASOF }))}</div>
      </div>`;

    const $ = (id) => el.querySelector('#' + id);
    $('eu-origin').value = saved.origin;
    $('eu-dest').value = saved.dest;

    function links() {
      const digits = $('eu-hs').value.replace(/\D/g, '');
      const code10 = digits ? digits.padEnd(10, '0').slice(0, 10) : '';
      const o = $('eu-origin').value;
      const d = $('eu-dest').value;
      const taric = 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=en'
        + (code10 ? `&Taric=${code10}&Area=${o}&SimDate=${todayStamp()}` : '');
      const a2m = 'https://trade.ec.europa.eu/access-to-markets/en/results'
        + (digits ? `?product=${digits.slice(0, 10)}&origin=${o}&destination=${d}` : '');
      $('eu-taric').href = taric;
      $('eu-a2m').href = a2m;
    }

    function setVatFromDest() {
      $('eu-vat').value = EU_VAT[$('eu-dest').value] ?? '';
    }

    function estimate() {
      const goods = parseFloat($('eu-goods').value);
      const out = $('eu-out');
      const low = $('eu-low').checked;
      $('eu-lines-row').hidden = !low;
      $('eu-lownote').hidden = !low;
      if (!(goods >= 0) || !isFinite(goods)) { out.innerHTML = ''; return; }
      const r = euLandedCost({
        goods,
        shipping: parseFloat($('eu-ship').value) || 0,
        dutyPct: parseFloat($('eu-rate').value) || 0,
        vatPct: parseFloat($('eu-vat').value) || 0,
        lowValue: low,
        lines: parseInt($('eu-lines').value, 10) || 1,
        flatEur: EU_LOW_VALUE.flatEur,
        threshold: EU_LOW_VALUE.thresholdEur,
      });
      const rows = [
        [t('eu.customsValue'), eur(r.customsValue)],
        [r.flat ? t('eu.dutyFlat') : t('eu.duty'), eur(r.duty)],
        [t('eu.vatAmt'), eur(r.vat)],
        [t('eu.total'), `<b class="total">${esc(eur(r.total))}</b>`, true],
      ];
      out.innerHTML = `<div class="results">${rows.map(([l, v, raw]) => `
        <div class="res-row"><div class="res-label">${esc(l)}</div><div class="res-val">${raw ? v : esc(v)}</div></div>`).join('')}</div>`
        + (low && goods > EU_LOW_VALUE.thresholdEur ? `<div class="warn">${esc(t('eu.lowOver'))}</div>` : '');
    }

    $('eu-dest').addEventListener('change', () => { setVatFromDest(); links(); set('euState', { origin: $('eu-origin').value, dest: $('eu-dest').value }); estimate(); });
    $('eu-origin').addEventListener('change', () => { links(); set('euState', { origin: $('eu-origin').value, dest: $('eu-dest').value }); });
    $('eu-hs').addEventListener('input', links);
    el.querySelectorAll('#eu-goods,#eu-ship,#eu-rate,#eu-vat,#eu-low,#eu-lines').forEach((n) => {
      n.addEventListener('input', estimate);
      n.addEventListener('change', estimate);
    });
    setVatFromDest();
    links();
    estimate();
    const pend = takePending('eutariff');
    if (pend && pend.hs) { $('eu-hs').value = pend.hs; links(); } else $('eu-hs').focus();
  },
};
