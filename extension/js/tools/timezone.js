import { t, registerMessages, getLang } from '../i18n.js';
import { esc } from '../dom.js';
import { CITIES, CITY_MAP, DEFAULT_ZONES } from '../data/cities.js';
import {
  zoneParts, fmtClock, fmtDate, diffHours, fmtDiff, isDst, workStatus, zonedTimeToUtc, pad2, isValidZone,
} from '../calc.js';
import { get, set } from '../store.js';

registerMessages({
  zh: {
    'tz.title': '世界时间',
    'tz.home': '主时区',
    'tz.local': '本机时区',
    'tz.add': '添加城市',
    'tz.addBtn': '添加',
    'tz.dst': '夏令',
    'tz.vsHome': '与主时区相差',
    'tz.hours': 'h',
    'tz.work': '对方上班时间',
    'tz.edge': '早晚时段',
    'tz.rest': '休息时间',
    'tz.conv': '时间转换',
    'tz.convDesc': '输入某地的日期时间，查看各城市对应的时间（自动处理夏令时）。',
    'tz.convFrom': '输入时间所在时区',
    'tz.legend': '图例：',
    'tz.beijing': '北京时间',
  },
  en: {
    'tz.title': 'World Time',
    'tz.home': 'Home zone',
    'tz.local': 'This device',
    'tz.add': 'Add a city',
    'tz.addBtn': 'Add',
    'tz.dst': 'DST',
    'tz.vsHome': 'Offset vs. home',
    'tz.hours': 'h',
    'tz.work': 'Business hours',
    'tz.edge': 'Early / late',
    'tz.rest': 'Off hours',
    'tz.conv': 'Time Converter',
    'tz.convDesc': 'Enter a date and time in one place to see the matching time in every city (DST handled automatically).',
    'tz.convFrom': 'Time zone of the input',
    'tz.legend': 'Legend:',
    'tz.beijing': 'Beijing Time',
  },
});

const localZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

function cityName(tz) {
  const c = CITY_MAP[tz];
  if (c) return getLang() === 'zh' ? c[1] : c[2];
  return tz.replace(/_/g, ' ').split('/').pop();
}

const shortName = (n) => n.replace(/\s*[（(].*?[）)]\s*/g, '').trim() || n;

const weekdayCache = {};
function weekdayName(date, tz, style = 'long') {
  const loc = getLang() === 'zh' ? 'zh-CN' : 'en-US';
  const k = loc + tz + style;
  weekdayCache[k] ||= new Intl.DateTimeFormat(loc, { timeZone: tz, weekday: style });
  return weekdayCache[k].format(date);
}

export default {
  id: 'timezone',
  titleKey: 'nav.timezone',
  async mount(el) {
    let home = await get('homeZone', null);
    if (!home || !isValidZone(home)) home = null;
    let zones = (await get('zones', DEFAULT_ZONES)).filter(isValidZone);
    let timer = null;

    const effectiveHome = () => home || localZone();

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('tz.title'))}</h2>
      <div class="pad">
        <div class="tz-main" id="tz-main"></div>
        <div class="tz-toolbar">
          <label>${esc(t('tz.home'))}:
            <select id="tz-home"></select></label>
          <label>${esc(t('tz.add'))}:
            <select id="tz-add"></select></label>
          <button class="btn" id="tz-addbtn">${esc(t('tz.addBtn'))}</button>
          <button class="btn ghost" id="tz-reset">${esc(t('common.reset'))}</button>
        </div>
        <div class="tz-grid" id="tz-grid"></div>
        <div class="legend small muted">${esc(t('tz.legend'))}
          <span class="dot work"></span>${esc(t('tz.work'))}
          <span class="dot edge"></span>${esc(t('tz.edge'))}
          <span class="dot rest"></span>${esc(t('tz.rest'))}</div>

        <h3 class="section-title">${esc(t('tz.conv'))}</h3>
        <div class="muted small">${esc(t('tz.convDesc'))}</div>
        <div class="inline-form" style="margin:8px 0">
          <input id="tz-dt" type="datetime-local">
          <select id="tz-from"></select>
        </div>
        <div id="tz-conv"></div>
      </div>`;

    const $ = (id) => el.querySelector('#' + id);

    function cityOptions(selected, withLocal) {
      const opts = [];
      if (withLocal) opts.push(`<option value="">${esc(t('tz.local'))} (${esc(localZone().split('/').pop().replace(/_/g, ' '))})</option>`);
      for (const c of CITIES) {
        opts.push(`<option value="${esc(c[0])}"${c[0] === selected ? ' selected' : ''}>${esc(getLang() === 'zh' ? c[1] : c[2])}</option>`);
      }
      return opts.join('');
    }

    function homeLabel() {
      const h = effectiveHome();
      if (h === 'Asia/Shanghai') return t('tz.beijing');
      return cityName(h);
    }

    function tick() {
      const now = new Date();
      const h = effectiveHome();
      const hp = zoneParts(now, h);
      $('tz-main').innerHTML = `
        <div class="tz-main-name">${esc(homeLabel())}</div>
        <div class="tz-main-date">${esc(weekdayName(now, h))} ${fmtDate(hp)}</div>
        <div class="tz-main-time">${fmtClock(hp)}</div>`;
      const cells = zones.filter((z) => z !== h).map((z) => {
        const p = zoneParts(now, z);
        const diff = diffHours(z, h, now);
        const st = workStatus(p);
        const c = CITY_MAP[z];
        return `<div class="tz-card">
          <button class="x" data-rm="${esc(z)}" title="${esc(t('common.remove'))}">×</button>
          <div class="tz-card-name" title="${esc(cityName(z))}">${c && c[3] ? `<span class="cc">${esc(c[3])}</span>` : ''}${esc(shortName(cityName(z)))}</div>
          <div class="tz-card-date">${esc(weekdayName(now, z, 'short'))} ${fmtDate(p)}</div>
          <div class="tz-card-time">${fmtClock(p)}</div>
          <div class="tz-card-meta" title="UTC${fmtUtc(now, z)}"><span class="dot ${st}"></span>${fmtDiff(diff)}${esc(t('tz.hours'))} · UTC${fmtUtc(now, z)}${isDst(now, z) ? ` · <span class="tag-s">${esc(t('tz.dst'))}</span>` : ''}</div>
        </div>`;
      });
      $('tz-grid').innerHTML = cells.join('');
    }

    function fmtUtc(date, tz) {
      const p = zoneParts(date, tz);
      const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      const off = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
      const sign = off >= 0 ? '+' : '-';
      const a = Math.abs(off);
      return `${sign}${Math.floor(a / 60)}${a % 60 ? ':' + pad2(a % 60) : ''}`;
    }

    function renderConv() {
      const v = $('tz-dt').value;
      const out = $('tz-conv');
      if (!v) { out.innerHTML = ''; return; }
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (!m) { out.innerHTML = ''; return; }
      const from = $('tz-from').value || effectiveHome();
      const inst = zonedTimeToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], from);
      const list = [effectiveHome(), ...zones.filter((z) => z !== effectiveHome())];
      out.innerHTML = `<table class="tbl"><tbody>${list.map((z) => {
        const p = zoneParts(inst, z);
        const st = workStatus(p);
        return `<tr><td><span class="dot ${st}"></span> ${esc(z === effectiveHome() ? homeLabel() : cityName(z))}</td>
          <td>${esc(weekdayName(inst, z))} ${fmtDate(p)}</td><td><b>${pad2(p.hour)}:${pad2(p.minute)}</b></td></tr>`;
      }).join('')}</tbody></table>`;
    }

    function refillSelects() {
      $('tz-home').innerHTML = cityOptions(home, true);
      $('tz-home').value = home || '';
      $('tz-add').innerHTML = cityOptions(null, false);
      const keep = $('tz-from').value;
      $('tz-from').innerHTML = cityOptions(null, true);
      $('tz-from').value = keep || '';
    }

    function setNowInInput() {
      const p = zoneParts(new Date(), $('tz-from').value || effectiveHome());
      $('tz-dt').value = `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
    }

    $('tz-home').addEventListener('change', () => {
      home = $('tz-home').value || null;
      set('homeZone', home);
      tick();
      renderConv();
    });
    $('tz-addbtn').addEventListener('click', () => {
      const z = $('tz-add').value;
      if (z && !zones.includes(z)) { zones.push(z); set('zones', zones); tick(); renderConv(); }
    });
    $('tz-reset').addEventListener('click', () => {
      zones = [...DEFAULT_ZONES];
      set('zones', zones);
      tick();
      renderConv();
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) {
        zones = zones.filter((z) => z !== b.dataset.rm);
        set('zones', zones);
        tick();
        renderConv();
      }
    });
    $('tz-dt').addEventListener('input', renderConv);
    $('tz-from').addEventListener('change', () => { setNowInInput(); renderConv(); });

    refillSelects();
    setNowInInput();
    tick();
    renderConv();
    timer = setInterval(tick, 1000);
    this._timer = timer;
  },
  unmount() {
    clearInterval(this._timer);
  },
};
