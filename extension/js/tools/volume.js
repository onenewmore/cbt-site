import { t, registerMessages } from '../i18n.js';
import { esc } from '../dom.js';
import { volumetricWeight, roundUpHalf, round2, fmt, KG_PER_LB } from '../calc.js';

registerMessages({
  zh: {
    'vol.title': '体积重计算器',
    'vol.notice': '体积重主要用于物流的货运环节：当一件物品体积太大而重量太轻时，运输中会把它的体积折算成重量来收取费用，核算整体的运输成本。',
    'vol.l': '长', 'vol.w': '宽', 'vol.h': '高',
    'vol.dims': '尺寸',
    'vol.qty': '件数',
    'vol.actual': '实际重量',
    'vol.actualPh': '单件，可选',
    'vol.factor': '系数',
    'vol.factorHint': '不同物流公司或不同运输方式计算体积重系数不同，具体系数请咨询对应物流公司',
    'vol.custom': '自定义',
    'vol.unit': '单位',
    'vol.unitMetric': 'CM（厘米）/KG（千克）',
    'vol.unitImperial': 'IN（英寸）/LB（磅）',
    'vol.round': '计费重量按 0.5 进位（DHL / FedEx 等常见规则）',
    'vol.formula': '体积重=（长x宽x高）/系数',
    'vol.result': '体积重',
    'vol.cbm': '体积',
    'vol.chargeable': '计费重量',
    'vol.byVol': '体积重大于实际重量，按体积重计费',
    'vol.byActual': '实际重量大于体积重，按实际重量计费',
    'vol.f5000': '5000 · DHL / FedEx / UPS / TNT 国际快递',
    'vol.f6000': '6000 · EMS / 空运 / 多数国际专线',
    'vol.f4000': '4000 · 部分空运 / 专线',
    'vol.f8000': '8000 · 部分经济类专线',
    'vol.f1000': '1000 · 海运拼箱（1CBM = 1000KG）',
    'vol.f139': '139 · UPS / FedEx 美国国内',
    'vol.f166': '166 · 国际 / USPS',
    'vol.methods': '体积重的三种测量方法',
    'vol.m1.t': '标准包裹测量方法',
    'vol.m1.d': '包裹为标准纸箱尺寸，则按照纸箱长宽高计算体积。',
    'vol.m1.e': '举例：如 DHL 渠道，包裹长15cm，宽30cm，高20cm，系数为5000，则体积重=(15x30x20)/5000=1.8KG，而实际重量1.2KG，则此包裹按体积重1.8KG计算运费。',
    'vol.m2.t': '凸起包裹测量方法',
    'vol.m2.d': '如包裹因货物挤压导致箱子平面膨胀变形凸起，则按包裹最长边计算体积重。',
    'vol.m2.e': '举例：如 DHL 渠道，纸箱实际长15cm，宽30cm，高20cm；因货物挤压，封箱后长18cm，宽32cm，高22cm，则体积重=(18x32x22)/5000=2.53KG，而实际重量为2KG，则此包裹按体积重2.53KG计算运费。',
    'vol.m3.t': '不规则包裹测量方法',
    'vol.m3.d': '如包裹实际大小需要打包成不规则包裹，则按包裹最长边计算体积重。',
    'vol.m3.e': '举例：如 DHL 渠道，不规则包裹最长长30cm，最长宽25cm，最长高40cm，则体积重=(15x25x40)/5000=3KG，而实际重量为2KG，则此包裹按体积重3KG计算运费。',
  },
  en: {
    'vol.title': 'Volumetric Weight Calculator',
    'vol.notice': 'Volumetric (dimensional) weight is used in freight: when a parcel is bulky but light, carriers convert its volume into a weight and bill the greater of actual and volumetric weight.',
    'vol.l': 'Length', 'vol.w': 'Width', 'vol.h': 'Height',
    'vol.dims': 'Size',
    'vol.qty': 'Pieces',
    'vol.actual': 'Weight',
    'vol.actualPh': 'per piece',
    'vol.factor': 'Divisor',
    'vol.factorHint': 'The divisor differs by carrier and service. Please confirm it with your carrier.',
    'vol.custom': 'Custom',
    'vol.unit': 'Units',
    'vol.unitMetric': 'CM / KG',
    'vol.unitImperial': 'IN / LB',
    'vol.round': 'Round billable weight up to the next 0.5 (common for DHL / FedEx)',
    'vol.formula': 'Volumetric weight = (L × W × H) ÷ divisor',
    'vol.result': 'Volumetric weight',
    'vol.cbm': 'Volume',
    'vol.chargeable': 'Billable weight',
    'vol.byVol': 'Volumetric weight is higher — billed by volumetric weight',
    'vol.byActual': 'Actual weight is higher — billed by actual weight',
    'vol.f5000': '5000 · DHL / FedEx / UPS / TNT international express',
    'vol.f6000': '6000 · EMS / air freight / most international lines',
    'vol.f4000': '4000 · some air freight / lines',
    'vol.f8000': '8000 · some economy lines',
    'vol.f1000': '1000 · Sea LCL (1 CBM = 1000 KG)',
    'vol.f139': '139 · UPS / FedEx US domestic',
    'vol.f166': '166 · International / USPS',
    'vol.methods': 'Three ways to measure a parcel',
    'vol.m1.t': 'Standard carton',
    'vol.m1.d': 'If the parcel is a standard carton, use the carton length × width × height.',
    'vol.m1.e': 'Example (DHL, divisor 5000): 15 × 30 × 20 cm → (15×30×20)/5000 = 1.8 kg. Actual weight 1.2 kg, so 1.8 kg is billed.',
    'vol.m2.t': 'Bulging parcel',
    'vol.m2.d': 'If the carton bulges because of its contents, measure the longest point on each side.',
    'vol.m2.e': 'Example (DHL): carton is 15 × 30 × 20 cm but bulges to 18 × 32 × 22 cm → (18×32×22)/5000 = 2.53 kg. Actual weight 2 kg, so 2.53 kg is billed.',
    'vol.m3.t': 'Irregular parcel',
    'vol.m3.d': 'If the parcel is irregular, use its longest length, longest width and longest height.',
    'vol.m3.e': 'Example (DHL): longest length 30 cm, width 25 cm, height 40 cm → (30×25×40)/5000 = 6 kg. Always measure the true maximum on each side.',
  },
});

const PRESETS = {
  metric: [5000, 6000, 4000, 8000, 1000],
  imperial: [139, 166],
};

export default {
  id: 'volume',
  titleKey: 'nav.volume',
  mount(el) {
    el.innerHTML = `
      <h2 class="panel-title">${esc(t('vol.title'))}</h2>
      <div class="pad">
        <div class="notice">${esc(t('vol.notice'))}</div>
        <div class="vol-layout">
          <div class="form compact">
            <div class="form-row"><label>*${esc(t('vol.dims'))}</label>
              <input id="v-l" class="s" type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(t('vol.l'))}">
              <span class="muted">×</span>
              <input id="v-w" class="s" type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(t('vol.w'))}">
              <span class="muted">×</span>
              <input id="v-h" class="s" type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(t('vol.h'))}">
              <span class="suffix" data-len>cm</span></div>
            <div class="form-row"><label>${esc(t('vol.qty'))}</label>
              <input id="v-qty" class="m" type="number" min="1" step="1" value="1"></div>
            <div class="form-row"><label>${esc(t('vol.actual'))}</label>
              <input id="v-act" class="m" type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(t('vol.actualPh'))}">
              <span class="suffix" data-wt>kg</span></div>
            <div class="form-row"><label>*${esc(t('vol.factor'))}</label>
              <input id="v-f" class="m" type="number" min="1" step="any" value="5000"></div>
            <div class="form-row"><label></label>
              <select id="v-fsel" style="width:100%"></select></div>
            <div class="form-row hint-row"><label></label>
              <div class="muted small">${esc(t('vol.factorHint'))}</div></div>
            <div class="form-row"><label>${esc(t('vol.unit'))}</label>
              <select id="v-sys">
                <option value="metric">${esc(t('vol.unitMetric'))}</option>
                <option value="imperial">${esc(t('vol.unitImperial'))}</option>
              </select></div>
            <div class="form-row"><label></label>
              <label class="check"><input id="v-round" type="checkbox"> ${esc(t('vol.round'))}</label></div>
            <div class="form-row"><label></label>
              <button class="btn primary" id="v-go">${esc(t('common.calc'))}</button></div>
          </div>
          <div class="card vol-result">
            <div class="muted">${esc(t('vol.result'))}</div>
            <div class="result-big" id="v-res">-- KG</div>
            <div class="result-sub" id="v-sub"></div>
            <div class="formula"><span class="tag">${esc(t('common.desc'))}</span> <span class="muted">${esc(t('vol.formula'))}</span></div>
          </div>
        </div>
        <h3 class="section-title">${esc(t('vol.methods'))}</h3>
        <div class="methods">
          ${[1, 2, 3].map((n) => `
          <div class="method"><div class="method-t">${esc(t(`vol.m${n}.t`))}</div>
            <p>${esc(t(`vol.m${n}.d`))}</p><p class="muted">${esc(t(`vol.m${n}.e`))}</p></div>`).join('')}
        </div>
      </div>`;

    const $ = (id) => el.querySelector('#' + id);
    const sysSel = $('v-sys');
    const fsel = $('v-fsel');
    const finput = $('v-f');

    function fillPresets(sys) {
      fsel.innerHTML = PRESETS[sys].map((f) => `<option value="${f}">${esc(t('vol.f' + f))}</option>`).join('')
        + `<option value="custom">${esc(t('vol.custom'))}</option>`;
      fsel.value = String(PRESETS[sys][0]);
      finput.value = PRESETS[sys][0];
    }

    function compute() {
      const imperial = sysSel.value === 'imperial';
      const L = parseFloat($('v-l').value);
      const W = parseFloat($('v-w').value);
      const H = parseFloat($('v-h').value);
      const F = parseFloat(finput.value);
      const Q = Math.max(1, parseInt($('v-qty').value, 10) || 1);
      const A = parseFloat($('v-act').value);
      const wUnit = imperial ? 'LB' : 'KG';
      const res = $('v-res');
      const sub = $('v-sub');
      if (!(L > 0 && W > 0 && H > 0 && F > 0)) {
        res.textContent = `-- ${wUnit}`;
        sub.innerHTML = '';
        return;
      }
      const vw = volumetricWeight(L, W, H, F, Q);
      const actualTotal = A > 0 ? A * Q : 0;
      const doRound = $('v-round').checked;
      const billable = Math.max(vw, actualTotal);
      const billableShown = doRound ? roundUpHalf(billable) : round2(billable);
      res.textContent = `${fmt(round2(vw))} ${wUnit}`;

      const rows = [];
      const volUnit = imperial ? 'in³' : 'cm³';
      const totalVol = L * W * H * Q;
      rows.push(`${esc(t('vol.cbm'))}: ${fmt(totalVol)} ${volUnit}` + (imperial ? '' : ` (${fmt(totalVol / 1e6)} m³)`));
      if (imperial) rows.push(`≈ ${fmt(round2(vw * KG_PER_LB))} KG`);
      else rows.push(`≈ ${fmt(round2(vw / KG_PER_LB))} LB`);
      if (actualTotal > 0) {
        rows.push(`${esc(t('vol.actual'))}${Q > 1 ? ' × ' + Q : ''}: ${fmt(round2(actualTotal))} ${wUnit}`);
        rows.push(`<b>${esc(t('vol.chargeable'))}: ${fmt(billableShown)} ${wUnit}</b> — ${esc(vw >= actualTotal ? t('vol.byVol') : t('vol.byActual'))}`);
      } else if (doRound) {
        rows.push(`<b>${esc(t('vol.chargeable'))}: ${fmt(billableShown)} ${wUnit}</b>`);
      }
      sub.innerHTML = rows.map((r) => `<div>${r}</div>`).join('');
    }

    function applySystem() {
      const imperial = sysSel.value === 'imperial';
      el.querySelector('[data-len]').textContent = imperial ? 'in' : 'cm';
      el.querySelector('[data-wt]').textContent = imperial ? 'lb' : 'kg';
      fillPresets(imperial ? 'imperial' : 'metric');
      compute();
    }

    sysSel.addEventListener('change', applySystem);
    fsel.addEventListener('change', () => {
      if (fsel.value === 'custom') finput.focus();
      else { finput.value = fsel.value; compute(); }
    });
    finput.addEventListener('input', () => {
      const m = Array.from(fsel.options).find((o) => o.value === finput.value);
      fsel.value = m ? m.value : 'custom';
    });
    el.addEventListener('input', compute);
    el.addEventListener('change', compute);
    $('v-go').addEventListener('click', compute);
    applySystem();
    $('v-l').focus();
  },
};
