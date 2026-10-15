// Minimal i18n: each module registers its own zh/en strings.
const dict = { zh: {}, en: {} };
let current = 'zh';

export function registerMessages(m) {
  for (const l of ['zh', 'en']) Object.assign(dict[l], m[l] || {});
}

export function resolveLang(pref) {
  if (pref === 'zh' || pref === 'en') return pref;
  const l = (navigator.language || 'en').toLowerCase();
  return l.startsWith('zh') ? 'zh' : 'en';
}

export function setLang(l) {
  current = l === 'zh' ? 'zh' : 'en';
  document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
}

export function getLang() {
  return current;
}

export function t(key, vars) {
  let s = dict[current][key] ?? dict.en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}

registerMessages({
  zh: {
    'app.title': '跨境工具',
    'app.openTab': '在新标签页打开',
    'app.lang': '语言',
    'lang.auto': '自动',
    'common.copied': '已复制',
    'common.copyHint': '点击复制',
    'common.search': '查询',
    'common.calc': '计算',
    'common.reset': '恢复默认',
    'common.add': '添加',
    'common.remove': '移除',
    'common.loading': '查询中…',
    'common.noData': '未找到结果',
    'common.netError': '无法连接数据源，请检查网络后重试。',
    'common.desc': '说明',
    'common.optional': '（可选）',
    'common.openOfficial': '打开官方网站',
    'nav.volume': '体积重计算',
    'nav.units': '单位换算',
    'nav.timezone': '时区查询',
    'nav.countries': '国家/地区二字码',
    'nav.ustariff': '美国关税查询',
    'nav.eutariff': '欧盟关税查询',
    'nav.postal': '邮编查地址',
  },
  en: {
    'app.title': 'Trade Tools',
    'app.openTab': 'Open in a new tab',
    'app.lang': 'Language',
    'lang.auto': 'Auto',
    'common.copied': 'Copied',
    'common.copyHint': 'Click to copy',
    'common.search': 'Search',
    'common.calc': 'Calculate',
    'common.reset': 'Reset',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.loading': 'Searching…',
    'common.noData': 'No results found',
    'common.netError': 'Could not reach the data source. Please check your connection and try again.',
    'common.desc': 'Note',
    'common.optional': '(optional)',
    'common.openOfficial': 'Open official site',
    'nav.volume': 'Volumetric Weight',
    'nav.units': 'Unit Converter',
    'nav.timezone': 'Time Zones',
    'nav.countries': 'Country Codes',
    'nav.ustariff': 'US Tariff',
    'nav.eutariff': 'EU Tariff',
    'nav.postal': 'Postal Lookup',
  },
});
