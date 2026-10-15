// Bulk calculator (volumetric weight / currency / HS matching). Runs locally; Pro lifts the row cap and enables CSV export.
import { cfg, track } from './track.js';
import { parseCsv, downloadCsv } from './csv.js';
import { state, paywall } from './gate.js';
import { volumetricWeight, roundUpHalf, convertCurrency, searchHsCommon, formatHs6, fmtMoney, round2 } from '../app/calc.js';
import { HS_COMMON } from '../app/data/hsdata.js';
import { loadRates } from '../app/tools/rates.js';

globalThis.CBT_PROXY = '';
const root = document.getElementById('bulk');
const L = JSON.parse(root.dataset.labels);
const zh = cfg.lang === 'zh';
const num = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return Number.isFinite(n) ? n : NaN; };

const SAMPLES = {
  volume: 'sku,length,width,height,weight,qty\nA-100,40,30,20,3.2,1\nB-200,50,40,30,6,2\nC-300,30,20,20,15,1\nD-400,60,45,35,4.5,3\nE-500,25,25,25,2,10\nF-600,80,60,50,18,1',
  fx: 'amount,from,to\n1000,CNY,USD\n250,USD,EUR\n99.9,EUR,GBP\n50000,JPY,CNY\n12,GBP,USD\n300,USD,CNY',
  hs: zh ? '蓝牙耳机\n手机壳\n瑜伽垫\nLED灯带\nbackpack\nsmartwatch\n连衣裙' : 'bluetooth headphones\nphone case\nyoga mat\nled strip\nbackpack\nsmartwatch\nsummer dress',
};

let tab = 'volume';
root.innerHTML = `
  <div class="tabs" role="tablist"></div>
  <div class="stack">
    <p class="muted small" id="b-help"></p>
    <textarea id="b-in" spellcheck="false" aria-label="input"></textarea>
    <div class="bulk-row">
      <label class="btn" style="cursor:pointer">${L.upload}<input id="b-file" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden></label>
      <button class="btn" id="b-sample" type="button">${L.sample}</button>
      <span id="b-opts" class="bulk-row"></span>
      <button class="btn primary" id="b-run" type="button">${L.run}</button>
      <button class="btn" id="b-exp" type="button">${L.export} <span class="tag-pro">${L.proBadge || 'Pro'}</span></button>
    </div>
    <p class="muted small" id="b-note"></p>
    <div id="b-out" class="tbl-wrap"></div>
  </div>`;
const $ = (id) => root.querySelector('#' + id);
let lastRows = null;

function renderTabs() {
  const box = root.querySelector('.tabs');
  box.innerHTML = '';
  for (const k of ['volume', 'fx', 'hs']) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(k === tab));
    b.textContent = L.tabs[k];
    b.addEventListener('click', () => { tab = k; lastRows = null; $('b-out').innerHTML = ''; $('b-in').value = ''; renderTabs(); renderOpts(); track('bulk_tab', { tab: k }); });
    box.appendChild(b);
  }
  $('b-help').textContent = tab === 'volume' ? L.volHelp : tab === 'fx' ? L.fxHelp : L.hsHelp;
}

function renderOpts() {
  const o = $('b-opts');
  if (tab === 'volume') {
    o.innerHTML = `<label>${L.unit} <select id="o-unit"><option value="metric">cm / kg</option><option value="imperial">in / lb</option></select></label>
      <label>${L.divisor} <input id="o-div" type="number" value="5000" min="1" step="any" style="width:90px"></label>
      <label><input id="o-half" type="checkbox"> 0.5</label>`;
    $('o-unit').addEventListener('change', () => { $('o-div').value = $('o-unit').value === 'metric' ? 5000 : 139; });
  } else if (tab === 'fx') {
    o.innerHTML = `<label>${zh ? '点差/手续费 %' : 'Spread / fee %'} <input id="o-fee" type="number" value="0" min="0" max="100" step="0.1" style="width:80px"></label>`;
  } else o.innerHTML = '';
}

const HEAD = {
  sku: ['sku', 'id', 'name', 'item'], length: ['length', 'l', 'len'], width: ['width', 'w'], height: ['height', 'h'],
  weight: ['weight', 'actual', 'kg', 'lb', 'wt'], qty: ['qty', 'quantity', 'pcs', 'pieces'],
};
function mapVolume(rows) {
  const first = rows[0] || [];
  const isHeader = first.slice(1, 5).some((c) => Number.isNaN(num(c)));
  let idx = { sku: 0, length: 1, width: 2, height: 3, weight: 4, qty: 5 };
  let data = rows;
  if (isHeader) {
    idx = {};
    first.forEach((c, i) => { const k = Object.keys(HEAD).find((key) => HEAD[key].includes(c.toLowerCase())); if (k && idx[k] === undefined) idx[k] = i; });
    data = rows.slice(1);
  }
  return data.map((r) => ({ sku: r[idx.sku] ?? '', l: num(r[idx.length]), w: num(r[idx.width]), h: num(r[idx.height]), weight: num(r[idx.weight]), qty: Number.isFinite(num(r[idx.qty])) ? num(r[idx.qty]) : 1 }));
}

async function compute(allRows) {
  if (tab === 'volume') {
    const div = num($('o-div').value) || 5000;
    const half = $('o-half').checked;
    const imp = $('o-unit').value === 'imperial';
    const u = imp ? 'lb' : 'kg';
    const head = ['sku', imp ? 'L(in)' : 'L(cm)', 'W', 'H', 'qty', `actual_${u}`, `volumetric_${u}`, `chargeable_${u}`, 'basis'];
    const out = mapVolume(allRows).map((r) => {
      if (![r.l, r.w, r.h].every((x) => x > 0)) return [r.sku, r.l, r.w, r.h, r.qty, '', '', '', 'invalid'];
      const vol = volumetricWeight(r.l, r.w, r.h, div, r.qty);
      const act = Number.isFinite(r.weight) ? r.weight * r.qty : NaN;
      let ch = Number.isFinite(act) ? Math.max(vol, act) : vol;
      if (half) ch = roundUpHalf(ch);
      return [r.sku, r.l, r.w, r.h, r.qty, Number.isFinite(act) ? round2(act) : '', round2(vol), round2(ch), Number.isFinite(act) && act >= vol ? 'actual' : 'volumetric'];
    });
    return [head, ...out];
  }
  if (tab === 'fx') {
    const fee = num($('o-fee').value) || 0;
    const { data } = await loadRates();
    if (!data) throw new Error('rates');
    const body = allRows[0] && Number.isNaN(num(allRows[0][0])) ? allRows.slice(1) : allRows;
    const out = body.map((r) => {
      const amt = num(r[0]); const from = (r[1] || '').toUpperCase(); const to = (r[2] || '').toUpperCase();
      const v = convertCurrency(amt, from, to, data.rates, fee);
      const rate = convertCurrency(1, from, to, data.rates, fee);
      return [r[0], from, to, v === null ? 'unknown currency' : fmtMoney(v, 2).replace(/,/g, ''), rate === null ? '' : String(Math.round(rate * 1e6) / 1e6)];
    });
    return [['amount', 'from', 'to', 'result', 'rate'], ...out, ['', '', '', '', `rates: ${data.date || ''}`]];
  }
  const out = allRows.map((r) => {
    const q = r.join(' ').trim();
    const hit = searchHsCommon(q, HS_COMMON, 1)[0];
    if (!hit) return [q, '', '', '', ''];
    const [nzh, nen] = String(hit[4] || '').split('||');
    return [q, formatHs6(hit[0]), hit[1], hit[2], zh ? (nzh || '') : (nen || nzh || '')];
  });
  return [['query', 'hs6', 'zh', 'en', 'note'], ...out];
}

function show(rows) {
  const t = document.createElement('table');
  t.className = 'tbl';
  const head = t.createTHead().insertRow();
  (rows[0] || []).forEach((c) => { const th = document.createElement('th'); th.textContent = c; head.appendChild(th); });
  const body = t.createTBody();
  rows.slice(1).forEach((r) => {
    const tr = body.insertRow();
    r.forEach((c) => { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });
  });
  $('b-out').replaceChildren(t);
}

$('b-sample').addEventListener('click', () => { $('b-in').value = SAMPLES[tab]; });
$('b-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { $('b-note').textContent = zh ? '文件太大（上限 5 MB）' : 'File too large (5 MB max)'; return; }
  $('b-in').value = await f.text();
});
$('b-run').addEventListener('click', async () => {
  const text = $('b-in').value;
  let rows = tab === 'hs' ? text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((s) => [s]) : parseCsv(text);
  if (!rows.length) return;
  const header = tab === 'volume' ? (Number.isNaN(num(rows[0][1])) ? 1 : 0) : tab === 'fx' ? (Number.isNaN(num(rows[0][0])) ? 1 : 0) : 0;
  const cap = state.pro ? cfg.pro.bulkRows : cfg.free.bulkRows;
  const total = rows.length - (tab === 'hs' ? 0 : header);
  if (total > cap) rows = tab === 'hs' ? rows.slice(0, cap) : rows.slice(0, cap + header);
  $('b-note').textContent = total > cap ? L.previewOnly.replace('{rows}', cfg.free.bulkRows).replace('{max}', cfg.pro.bulkRows.toLocaleString('en-US')) : `${Math.min(total, cap)} ${L.rows}`;
  if (total > cap && !state.pro) paywall('bulk', { n: cfg.free.bulkRows, max: cfg.pro.bulkRows.toLocaleString('en-US') });
  try {
    lastRows = await compute(rows);
    show(lastRows);
    track('bulk_run', { tab, rows: String(Math.min(total, cap)), pro: state.pro ? '1' : '0' });
  } catch (e) {
    $('b-out').textContent = zh ? '无法获取汇率，请稍后重试。' : 'Could not load exchange rates. Please try again.';
  }
});
$('b-exp').addEventListener('click', () => {
  track('export_click', { tool: 'bulk-' + tab, pro: state.pro ? '1' : '0' });
  if (!state.pro) { paywall('export'); return; }
  if (lastRows) downloadCsv(lastRows, `bulk-${tab}-${new Date().toISOString().slice(0, 10)}.csv`);
});

renderTabs();
renderOpts();
