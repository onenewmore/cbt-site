import { t, registerMessages, getLang } from '../i18n.js';
import { esc, bindCopy } from '../dom.js';
import { UNIT_CATEGORIES } from '../data/units.js';
import { convertAll, fmt } from '../calc.js';
import { get, set } from '../store.js';

registerMessages({
  zh: {
    'unit.title': '单位换算',
    'unit.length': '长度', 'unit.weight': '重量', 'unit.volume': '体积', 'unit.area': '面积', 'unit.temperature': '温度',
    'unit.convert': '换算',
    'unit.metric': '公制单位', 'unit.imperial': '英制单位', 'unit.other': '其他单位',
    'unit.ph': '请输入数值',
    'unit.tip': '点击任意结果即可复制数值',
  },
  en: {
    'unit.title': 'Unit Converter',
    'unit.length': 'Length', 'unit.weight': 'Weight', 'unit.volume': 'Volume', 'unit.area': 'Area', 'unit.temperature': 'Temperature',
    'unit.convert': 'Convert',
    'unit.metric': 'Metric', 'unit.imperial': 'Imperial / US', 'unit.other': 'Other',
    'unit.ph': 'Enter a value',
    'unit.tip': 'Click any result to copy the number',
  },
});

const unitLabel = (u) => (getLang() === 'zh' ? `${u[2]}(${u[4]})` : `${u[3]} (${u[4]})`);

export default {
  id: 'units',
  titleKey: 'nav.units',
  async mount(el) {
    const state = await get('unitState', { cat: 'length', from: {} });
    let cat = UNIT_CATEGORIES[state.cat] ? state.cat : 'length';

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('unit.title'))}</h2>
      <div class="pad">
        <div class="radios" id="u-cats">
          ${Object.keys(UNIT_CATEGORIES).map((c) => `
            <label class="radio"><input type="radio" name="ucat" value="${c}"> ${esc(t('unit.' + c))}</label>`).join('')}
        </div>
        <div class="inline-form">
          <input id="u-val" type="number" step="any" inputmode="decimal" placeholder="${esc(t('unit.ph'))}">
          <select id="u-from"></select>
          <button class="btn primary" id="u-go">${esc(t('unit.convert'))}</button>
        </div>
        <div class="muted small" style="margin-top:6px">${esc(t('unit.tip'))}</div>
        <div id="u-out"></div>
      </div>`;
    bindCopy(el);

    const $ = (id) => el.querySelector('#' + id);
    const valInput = $('u-val');
    const fromSel = $('u-from');

    function fillUnits() {
      const def = UNIT_CATEGORIES[cat];
      const opts = [];
      for (const g of Object.values(def.groups)) for (const u of g) opts.push(`<option value="${u[0]}">${esc(unitLabel(u))}</option>`);
      fromSel.innerHTML = opts.join('');
      fromSel.value = state.from[cat] || def.def;
    }

    function render() {
      const def = UNIT_CATEGORIES[cat];
      const v = parseFloat(valInput.value);
      const ok = isFinite(v);
      const res = ok ? convertAll(cat, v, fromSel.value) : null;
      $('u-out').innerHTML = Object.entries(def.groups).map(([gk, units]) => `
        <h3 class="section-title small">${esc(t('unit.' + gk))}</h3>
        <div class="unit-grid">
          ${units.map((u) => {
            const raw = ok ? res[u[0]] : null;
            const shown = ok ? fmt(raw) : '--';
            return `<div class="unit-cell ${ok ? 'copyable' : ''}" ${ok ? `data-copy="${esc(String(parseFloat(raw.toPrecision(12))))}"` : ''}>
              <span class="unit-val">${esc(shown)}</span><span class="unit-name">${esc(unitLabel(u))}</span></div>`;
          }).join('')}
        </div>`).join('');
    }

    function setCat(c) {
      cat = c;
      state.cat = c;
      set('unitState', state);
      el.querySelectorAll('input[name=ucat]').forEach((r) => { r.checked = r.value === c; });
      fillUnits();
      render();
    }

    el.querySelectorAll('input[name=ucat]').forEach((r) => r.addEventListener('change', () => setCat(r.value)));
    valInput.addEventListener('input', render);
    $('u-go').addEventListener('click', render);
    fromSel.addEventListener('change', () => { state.from[cat] = fromSel.value; set('unitState', state); render(); });
    setCat(cat);
    valInput.focus();
  },
};
