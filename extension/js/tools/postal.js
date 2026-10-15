import { t, registerMessages, getLang } from '../i18n.js';
import { esc, fetchJson, bindCopy } from '../dom.js';
import { COUNTRIES, countryName } from '../data/countries.js';
import { ZIPPO_COUNTRIES, normalizePostal } from '../calc.js';
import { get, set } from '../store.js';

registerMessages({
  zh: {
    'zip.title': '邮编查地址',
    'zip.country': '国家/地区',
    'zip.code': '邮编',
    'zip.codePh': '请输入邮政编码，例如 90210',
    'zip.go': '查询',
    'zip.place': '城市/地区',
    'zip.state': '州/省',
    'zip.countryName': '国家',
    'zip.coords': '经纬度',
    'zip.map': '在地图上查看',
    'zip.copy': '复制地址',
    'zip.source': '数据来源',
    'zip.hint': '支持全球 80+ 个国家的精确邮编库，其他国家会自动改用 OpenStreetMap 检索。英国仅需外码（如 SW1A），加拿大前 3 位（如 M5V）。',
    'zip.cnHint': '中国大陆邮编在公开接口里覆盖较少，结果可能为空或不精确，仅供参考。',
    'zip.empty': '请输入邮政编码',
    'zip.nf': '没有找到该邮编对应的地址，请确认国家与邮编格式是否正确。',
  },
  en: {
    'zip.title': 'Postal Code → Address',
    'zip.country': 'Country / Region',
    'zip.code': 'Postal code',
    'zip.codePh': 'Enter a postal code, e.g. 90210',
    'zip.go': 'Search',
    'zip.place': 'City / Place',
    'zip.state': 'State / Province',
    'zip.countryName': 'Country',
    'zip.coords': 'Coordinates',
    'zip.map': 'View on map',
    'zip.copy': 'Copy address',
    'zip.source': 'Source',
    'zip.hint': 'Exact postal data for 80+ countries; other countries fall back to OpenStreetMap search. For the UK enter the outward code only (e.g. SW1A); for Canada the first 3 characters (e.g. M5V).',
    'zip.cnHint': 'Mainland China is poorly covered by public APIs, so results may be empty or imprecise.',
    'zip.empty': 'Please enter a postal code',
    'zip.nf': 'No address found. Check the country and the postal code format.',
  },
});

async function viaZippopotam(cc, code) {
  const data = await fetchJson(`https://api.zippopotam.us/${cc.toLowerCase()}/${encodeURIComponent(code)}`);
  return (data.places || []).map((p) => ({
    place: p['place name'],
    state: p.state || '',
    stateAbbr: p['state abbreviation'] || '',
    country: data.country,
    code: data['post code'] || code,
    lat: p.latitude,
    lon: p.longitude,
    source: 'Zippopotam.us',
  }));
}

async function viaNominatim(cc, code, lang) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5'
    + `&postalcode=${encodeURIComponent(code)}&countrycodes=${cc.toLowerCase()}&accept-language=${lang === 'zh' ? 'zh-CN,en' : 'en'}`;
  const data = await fetchJson(url);
  return data.map((r) => {
    const a = r.address || {};
    return {
      place: a.city || a.town || a.village || a.suburb || a.county || a.municipality || (r.display_name || '').split(',')[0],
      state: a.state || a.province || a.region || '',
      stateAbbr: '',
      country: a.country || '',
      code: a.postcode || code,
      lat: r.lat,
      lon: r.lon,
      full: r.display_name,
      source: 'OpenStreetMap / Nominatim',
    };
  });
}

export default {
  id: 'postal',
  titleKey: 'nav.postal',
  async mount(el) {
    const lang = getLang();
    const saved = await get('zipState', { cc: null });
    let guess = 'US';
    try {
      const m = (navigator.language || '').match(/-([A-Za-z]{2})$/);
      if (m) guess = m[1].toUpperCase();
    } catch { /* ignore */ }
    const collator = new Intl.Collator(lang === 'zh' ? 'zh-Hans-CN-u-co-pinyin' : 'en');
    const list = COUNTRIES.map((c) => ({ a2: c.a2, name: countryName(c.a2, lang) })).sort((a, b) => collator.compare(a.name, b.name));

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('zip.title'))}</h2>
      <div class="pad">
        <div class="form">
          <div class="form-row"><label>${esc(t('zip.country'))}</label>
            <select id="zip-cc">${list.map((c) => `<option value="${c.a2}">${esc(c.name)} (${c.a2})${ZIPPO_COUNTRIES.has(c.a2) ? ' ★' : ''}</option>`).join('')}</select></div>
          <div class="form-row"><label>${esc(t('zip.code'))}</label>
            <input id="zip-code" type="text" placeholder="${esc(t('zip.codePh'))}" style="width:260px" autocomplete="off">
            <button class="btn primary" id="zip-go">${esc(t('zip.go'))}</button></div>
        </div>
        <div class="muted small">${esc(t('zip.hint'))}</div>
        <div id="zip-note" class="muted small"></div>
        <div id="zip-out"></div>
      </div>`;
    bindCopy(el);

    const $ = (id) => el.querySelector('#' + id);
    const cc0 = saved.cc || (list.some((c) => c.a2 === guess) ? guess : 'US');
    $('zip-cc').value = cc0;

    function note() {
      $('zip-note').textContent = $('zip-cc').value === 'CN' ? t('zip.cnHint') : '';
    }

    function formatAddress(r) {
      if (r.full) return r.full;
      const left = [r.place, [r.stateAbbr || r.state, r.code].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      return [left, r.country].filter(Boolean).join(', ');
    }

    async function run() {
      const cc = $('zip-cc').value;
      const code = normalizePostal(cc, $('zip-code').value);
      const out = $('zip-out');
      set('zipState', { cc });
      if (!code) { out.innerHTML = `<div class="warn">${esc(t('zip.empty'))}</div>`; return; }
      out.innerHTML = `<div class="muted">${esc(t('common.loading'))}</div>`;
      let results = [];
      let failed = false;
      if (ZIPPO_COUNTRIES.has(cc)) {
        try { results = await viaZippopotam(cc, code); } catch (e) { if (e.status !== 404) failed = true; }
      }
      if (!results.length) {
        try { results = await viaNominatim(cc, code, lang); failed = false; } catch { failed = failed || true; }
      }
      if (!results.length) {
        out.innerHTML = `<div class="warn">${esc(failed ? t('common.netError') : t('zip.nf'))}</div>`;
        return;
      }
      out.innerHTML = results.map((r) => {
        const addr = formatAddress(r);
        const map = (r.lat && r.lon) ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(r.lat)}&mlon=${encodeURIComponent(r.lon)}#map=13/${encodeURIComponent(r.lat)}/${encodeURIComponent(r.lon)}` : '';
        return `<div class="zip-card">
          <div class="zip-addr">${esc(addr)}</div>
          <div class="zip-grid">
            <div><span class="muted">${esc(t('zip.code'))}</span> ${esc(r.code)}</div>
            <div><span class="muted">${esc(t('zip.place'))}</span> ${esc(r.place)}</div>
            <div><span class="muted">${esc(t('zip.state'))}</span> ${esc(r.state)}${r.stateAbbr ? ` (${esc(r.stateAbbr)})` : ''}</div>
            <div><span class="muted">${esc(t('zip.countryName'))}</span> ${esc(r.country)}</div>
            ${r.lat ? `<div><span class="muted">${esc(t('zip.coords'))}</span> ${esc(Number(r.lat).toFixed(4))}, ${esc(Number(r.lon).toFixed(4))}</div>` : ''}
          </div>
          <div class="zip-actions">
            <button class="btn small" data-copy="${esc(addr)}">${esc(t('zip.copy'))}</button>
            ${map ? `<a class="btn small" href="${map}" target="_blank" rel="noopener">${esc(t('zip.map'))}</a>` : ''}
            <span class="muted small">${esc(t('zip.source'))}: ${esc(r.source)}</span>
          </div>
        </div>`;
      }).join('');
    }

    $('zip-go').addEventListener('click', run);
    $('zip-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    $('zip-cc').addEventListener('change', () => { note(); set('zipState', { cc: $('zip-cc').value }); if ($('zip-code').value) run(); });
    note();
    $('zip-code').focus();
  },
};
