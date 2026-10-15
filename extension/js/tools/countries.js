import { t, registerMessages, getLang } from '../i18n.js';
import { esc, bindCopy, debounce } from '../dom.js';
import { COUNTRIES, countryName } from '../data/countries.js';
import { diffHours, fmtDiff, isValidZone } from '../calc.js';
import { get } from '../store.js';

registerMessages({
  zh: {
    'cc.title': '国家/地区二字码',
    'cc.postalLink': '查询邮编地址：',
    'cc.go': '点击前往》',
    'cc.search': '搜索国家名 / 二字码 / 三字码 / 电话区号',
    'cc.name': '国家/地区',
    'cc.enName': '英文名字',
    'cc.a2': '二字码',
    'cc.a3': '三字码',
    'cc.dial': '电话代码',
    'cc.diff': '时差',
    'cc.diffTip': '相对主时区（当前时刻，已含夏令时）；多时区国家以首都/主要城市为准',
    'cc.count': '共 {n} 个',
    'cc.tip': '点击二字码、三字码或电话代码即可复制',
  },
  en: {
    'cc.title': 'Country / Region Codes',
    'cc.postalLink': 'Look up an address by postal code: ',
    'cc.go': 'Open »',
    'cc.search': 'Search by name / alpha-2 / alpha-3 / dial code',
    'cc.name': 'Country / Region',
    'cc.enName': 'English name',
    'cc.a2': 'Alpha-2',
    'cc.a3': 'Alpha-3',
    'cc.dial': 'Dial code',
    'cc.diff': 'Time diff',
    'cc.diffTip': 'Versus your home zone at this moment (DST included). Multi-zone countries use the capital / main city.',
    'cc.count': '{n} entries',
    'cc.tip': 'Click an alpha-2, alpha-3 or dial code to copy it',
  },
});

export default {
  id: 'countries',
  titleKey: 'nav.countries',
  async mount(el) {
    const lang = getLang();
    let home = await get('homeZone', null);
    try { if (!home || !isValidZone(home)) home = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { home = 'UTC'; }
    const now = new Date();
    const collator = new Intl.Collator(lang === 'zh' ? 'zh-Hans-CN-u-co-pinyin' : 'en');

    const rows = COUNTRIES.map((c) => ({
      ...c,
      name: countryName(c.a2, lang),
      en: countryName(c.a2, 'en'),
      diff: isValidZone(c.tz) ? diffHours(c.tz, home, now) : null,
    })).sort((a, b) => collator.compare(a.name, b.name));

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('cc.title'))}</h2>
      <div class="pad">
        <div class="cc-top">
          <span>${esc(t('cc.postalLink'))}<a href="#" id="cc-goto">${esc(t('cc.go'))}</a></span>
          <input id="cc-q" type="search" placeholder="${esc(t('cc.search'))}">
          <span class="muted small" id="cc-count"></span>
        </div>
        <div class="muted small">${esc(t('cc.tip'))}</div>
      </div>
      <div class="tbl-wrap">
        <table class="tbl sticky">
          <thead><tr>
            <th>${esc(t('cc.name'))}</th><th>${esc(t('cc.enName'))}</th><th>${esc(t('cc.a2'))}</th>
            <th>${esc(t('cc.a3'))}</th><th>${esc(t('cc.dial'))}</th><th title="${esc(t('cc.diffTip'))}">${esc(t('cc.diff'))} ⓘ</th>
          </tr></thead>
          <tbody id="cc-body"></tbody>
        </table>
      </div>`;
    bindCopy(el);

    const body = el.querySelector('#cc-body');
    function render(q) {
      const s = q.trim().toLowerCase();
      const list = !s ? rows : rows.filter((r) => (
        r.name.toLowerCase().includes(s) || r.en.toLowerCase().includes(s) || r.a2.toLowerCase() === s
        || r.a3.toLowerCase().startsWith(s) || r.dial.startsWith(s.replace(/^\+/, ''))
      ));
      body.innerHTML = list.map((r) => `<tr>
        <td>${esc(r.name)}</td><td>${esc(r.en)}</td>
        <td class="copyable mono" data-copy="${r.a2}">${r.a2}</td>
        <td class="copyable mono" data-copy="${r.a3}">${r.a3}</td>
        <td class="copyable mono" data-copy="+${r.dial}">${r.dial}</td>
        <td>${r.diff === null ? '—' : fmtDiff(r.diff)}</td></tr>`).join('');
      el.querySelector('#cc-count').textContent = t('cc.count', { n: list.length });
    }
    el.querySelector('#cc-q').addEventListener('input', debounce((e) => render(e.target.value), 120));
    el.querySelector('#cc-goto').addEventListener('click', (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('cbt:goto', { detail: 'postal' }));
    });
    render('');
  },
};
