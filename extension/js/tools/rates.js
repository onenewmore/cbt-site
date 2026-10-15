import { t, registerMessages, getLang } from '../i18n.js';
import { esc, fetchJson, bindCopy } from '../dom.js';
import {
  parseErApi, parseFawaz, parseFrankfurter, crossRate, convertCurrency, rateDigits, fmtMoney,
} from '../calc.js';
import { get, set } from '../store.js';

registerMessages({
  zh: {
    'nav.rates': '汇率换算',
    'fx.title': '汇率换算',
    'fx.amount': '金额',
    'fx.fee': '点差/手续费',
    'fx.feeHint': '收款平台或银行换汇时的点差、手续费，填写后换算结果会扣除该比例',
    'fx.feeUnit': '% （可选）',
    'fx.refresh': '刷新汇率',
    'fx.updated': '汇率日期',
    'fx.source': '数据源',
    'fx.cached': '（缓存）',
    'fx.stale': '网络不可用，正在使用缓存汇率（{d}），可能已过期。',
    'fx.col.cur': '币种',
    'fx.col.rate': '汇率',
    'fx.col.amt': '换算结果',
    'fx.rowRate': '1 {from} = {rate} {to}',
    'fx.add': '添加币种',
    'fx.addBtn': '添加',
    'fx.reset': '恢复常用币种',
    'fx.remove': '移除',
    'fx.empty': '请输入有效金额',
    'fx.err': '无法获取汇率，请检查网络后点击“刷新汇率”。',
    'fx.tip': '点击换算结果可复制数值。',
    'fx.note': '汇率为国际市场中间价，每日更新，仅供参考；实际结算以银行、支付平台（PayPal / Payoneer / 万里汇等）或平台结汇汇率为准。',
    'fx.attr': '汇率数据',
  },
  en: {
    'nav.rates': 'Exchange Rates',
    'fx.title': 'Exchange Rates',
    'fx.amount': 'Amount',
    'fx.fee': 'Spread / fee',
    'fx.feeHint': 'Bank or payment-platform margin. The converted amounts are reduced by this percentage.',
    'fx.feeUnit': '% (optional)',
    'fx.refresh': 'Refresh rates',
    'fx.updated': 'Rates date',
    'fx.source': 'Source',
    'fx.cached': '(cached)',
    'fx.stale': 'You appear to be offline — using cached rates ({d}), which may be out of date.',
    'fx.col.cur': 'Currency',
    'fx.col.rate': 'Rate',
    'fx.col.amt': 'Converted',
    'fx.rowRate': '1 {from} = {rate} {to}',
    'fx.add': 'Add currency',
    'fx.addBtn': 'Add',
    'fx.reset': 'Restore defaults',
    'fx.remove': 'Remove',
    'fx.empty': 'Please enter a valid amount',
    'fx.err': 'Could not load exchange rates. Check your connection and click “Refresh rates”.',
    'fx.tip': 'Click a converted amount to copy it.',
    'fx.note': 'Mid-market rates, updated daily — for reference only. Actual settlement uses your bank / payment platform (PayPal, Payoneer, WorldFirst…) rates.',
    'fx.attr': 'Rates by',
  },
});

const DEFAULT_PINNED = ['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'SGD', 'KRW', 'AED', 'BRL'];
const TTL = 6 * 3600 * 1000;
const PROVIDERS = [
  { url: 'https://open.er-api.com/v6/latest/USD', parse: parseErApi },
  { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json', parse: parseFawaz },
  { url: 'https://api.frankfurter.dev/v1/latest?base=USD', parse: parseFrankfurter },
];

function isoCurrencies() {
  try {
    if (typeof Intl.supportedValuesOf === 'function') return new Set(Intl.supportedValuesOf('currency'));
  } catch { /* ignore */ }
  return null;
}

// providers are tried in order; the first usable answer wins
export async function loadRates({ force = false } = {}) {
  const cached = await get('ratesCache', null);
  if (!force && cached && cached.rates && Date.now() - cached.fetchedAt < TTL) return { data: cached, fromCache: true, stale: false };
  const allow = isoCurrencies();
  for (const p of PROVIDERS) {
    try {
      const json = await fetchJson(p.url, { timeout: 9000 });
      const data = p.parse(json, allow);
      if (data && Object.keys(data.rates).length > 20) {
        data.fetchedAt = Date.now();
        await set('ratesCache', data);
        return { data, fromCache: false, stale: false };
      }
    } catch { /* try the next provider */ }
  }
  if (cached && cached.rates) return { data: cached, fromCache: true, stale: true };
  return { data: null, fromCache: false, stale: false };
}

export default {
  id: 'rates',
  titleKey: 'nav.rates',
  async mount(el) {
    const lang = getLang();
    const state = Object.assign({ amount: 100, from: 'USD', fee: '', pinned: DEFAULT_PINNED.slice() }, await get('ratesState', {}));
    if (!Array.isArray(state.pinned) || !state.pinned.length) state.pinned = DEFAULT_PINNED.slice();

    let dn = null;
    try { dn = new Intl.DisplayNames([lang === 'zh' ? 'zh-CN' : 'en'], { type: 'currency' }); } catch { /* ignore */ }
    const nameOf = (c) => { try { return dn ? dn.of(c) : c; } catch { return c; } };
    const collator = new Intl.Collator(lang === 'zh' ? 'zh-Hans-CN-u-co-pinyin' : 'en');

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('fx.title'))} <span class="help" title="${esc(t('fx.note'))}">?</span></h2>
      <div class="pad">
        <div class="form">
          <div class="form-row"><label>${esc(t('fx.amount'))}</label>
            <input id="fx-amt" type="number" step="any" min="0" inputmode="decimal" style="width:150px">
            <select id="fx-from"></select>
            <button class="btn small" id="fx-refresh" type="button">${esc(t('fx.refresh'))}</button></div>
          <div class="form-row"><label>${esc(t('fx.fee'))}</label>
            <input id="fx-fee" type="number" step="any" min="0" max="100" style="width:90px" title="${esc(t('fx.feeHint'))}">
            <span class="muted small">${esc(t('fx.feeUnit'))}</span></div>
        </div>
        <div id="fx-status" class="muted small fx-meta"></div>
        <div id="fx-out"></div>
        <div class="fx-add">
          <select id="fx-pick" aria-label="${esc(t('fx.add'))}"></select>
          <button class="btn small" id="fx-addbtn" type="button">${esc(t('fx.addBtn'))}</button>
          <button class="btn small ghost" id="fx-reset" type="button">${esc(t('fx.reset'))}</button>
        </div>
        <div class="muted small foot">${esc(t('fx.tip'))} ${esc(t('fx.note'))}</div>
        <div id="fx-attr" class="muted small"></div>
      </div>`;
    bindCopy(el);

    const $ = (id) => el.querySelector('#' + id);
    let rates = null;

    const save = () => set('ratesState', { amount: state.amount, from: state.from, fee: state.fee, pinned: state.pinned });
    const label = (c) => `${c} · ${nameOf(c)}`;

    function fillSelects() {
      const codes = Object.keys(rates || { [state.from]: 1 }).sort((a, b) => collator.compare(nameOf(a), nameOf(b)));
      const opts = codes.map((c) => `<option value="${c}">${esc(label(c))}</option>`);
      $('fx-from').innerHTML = opts.join('');
      $('fx-from').value = codes.includes(state.from) ? state.from : 'USD';
      state.from = $('fx-from').value;
      $('fx-pick').innerHTML = codes.filter((c) => !state.pinned.includes(c)).map((c) => `<option value="${c}">${esc(label(c))}</option>`).join('');
    }

    function renderStatus(r) {
      const st = $('fx-status');
      if (!r.data) { st.innerHTML = `<div class="warn">${esc(t('fx.err'))}</div>`; $('fx-attr').textContent = ''; return; }
      const d = r.data;
      st.innerHTML = `${esc(t('fx.updated'))}: <b>${esc(d.date)}</b> · ${esc(t('fx.source'))}: ${esc(d.source)}${r.fromCache ? ' ' + esc(t('fx.cached')) : ''}`
        + (r.stale ? `<div class="warn">${esc(t('fx.stale', { d: d.date }))}</div>` : '');
      $('fx-attr').innerHTML = d.source === 'open.er-api.com'
        ? `${esc(t('fx.attr'))} <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Exchange Rate API</a>` : '';
    }

    function render() {
      const out = $('fx-out');
      if (!rates) { out.innerHTML = ''; return; }
      const amount = parseFloat($('fx-amt').value);
      const fee = parseFloat($('fx-fee').value);
      const ok = isFinite(amount) && amount >= 0;
      if (!ok) { out.innerHTML = `<div class="warn">${esc(t('fx.empty'))}</div>`; return; }
      const rows = state.pinned.filter((c) => c !== state.from && rates[c]).map((c) => {
        const r = crossRate(state.from, c, rates);
        const conv = convertCurrency(amount, state.from, c, rates, fee);
        const digits = c === 'JPY' || c === 'KRW' || c === 'VND' || c === 'IDR' ? 0 : 2;
        const shown = fmtMoney(conv, digits);
        const raw = String(parseFloat(conv.toFixed(digits)));
        return `<tr>
          <td><span class="cc">${esc(c)}</span>${esc(nameOf(c))}</td>
          <td class="muted small">${esc(t('fx.rowRate', { from: state.from, to: c, rate: fmtMoney(r, rateDigits(r)) }))}</td>
          <td class="copyable fx-amt" data-copy="${esc(raw)}"><b>${esc(shown)}</b></td>
          <td class="fx-x"><button class="x" type="button" data-rm="${c}" title="${esc(t('fx.remove'))}">×</button></td>
        </tr>`;
      });
      out.innerHTML = `<table class="tbl fx-tbl">
        <thead><tr><th>${esc(t('fx.col.cur'))}</th><th>${esc(t('fx.col.rate'))}</th><th>${esc(t('fx.col.amt'))}</th><th></th></tr></thead>
        <tbody>${rows.join('')}</tbody></table>`;
    }

    async function refresh(force) {
      $('fx-status').innerHTML = `<span class="muted">${esc(t('common.loading'))}</span>`;
      const r = await loadRates({ force });
      rates = r.data ? r.data.rates : null;
      renderStatus(r);
      fillSelects();
      render();
    }

    $('fx-amt').value = state.amount;
    $('fx-fee').value = state.fee;
    $('fx-amt').addEventListener('input', () => { state.amount = $('fx-amt').value; save(); render(); });
    $('fx-fee').addEventListener('input', () => { state.fee = $('fx-fee').value; save(); render(); });
    $('fx-from').addEventListener('change', () => { state.from = $('fx-from').value; save(); render(); });
    $('fx-refresh').addEventListener('click', () => refresh(true));
    $('fx-addbtn').addEventListener('click', () => {
      const c = $('fx-pick').value;
      if (c && !state.pinned.includes(c)) { state.pinned.push(c); save(); fillSelects(); render(); }
    });
    $('fx-reset').addEventListener('click', () => { state.pinned = DEFAULT_PINNED.slice(); save(); fillSelects(); render(); });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      state.pinned = state.pinned.filter((c) => c !== b.dataset.rm);
      save(); fillSelects(); render();
    });

    fillSelects();
    await refresh(false);
    $('fx-amt').focus();
  },
};
