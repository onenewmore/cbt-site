// Free-tier limits + paywall modal. The image tool calls window.CBT_GATE (hooks inserted by the site build).
import { cfg, track } from './track.js';
import { isProCached, me, pricingUrl } from './pro.js';

const T = {
  en: {
    h: 'This is a Pro feature', cta: 'See Pro plans', close: 'Not now',
    img_files: 'The free plan processes up to {n} images per run. Pro removes the limit.',
    img_presets: 'The free plan uses up to {n} presets per run. Pro removes the limit.',
    zip: 'ZIP download is part of Pro. You can still download each file one by one.',
    export: 'Exporting results to CSV is part of Pro.',
    bulk: 'The free preview shows the first {n} rows. Pro processes up to {max} rows and exports CSV.',
  },
  zh: {
    h: '这是 Pro 功能', cta: '查看 Pro 套餐', close: '以后再说',
    img_files: '免费版每次最多处理 {n} 张图片，Pro 不限量。',
    img_presets: '免费版每次最多使用 {n} 个预设，Pro 不限量。',
    zip: 'ZIP 下载属于 Pro 功能，你仍可逐张下载。',
    export: '导出 CSV 属于 Pro 功能。',
    bulk: '免费预览只显示前 {n} 行。Pro 最多处理 {max} 行并可导出 CSV。',
  },
};

export const state = { pro: isProCached() };
me().then((m) => { state.pro = m.plan === 'pro'; });

export function paywall(reason, vars = {}) {
  track('limit_hit', { what: reason });
  const t = T[cfg.lang] || T.en;
  const msg = (t[reason] || t.h).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  document.querySelector('.paywall')?.remove();
  const el = document.createElement('div');
  el.className = 'paywall';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="paywall-box"><h3></h3><p></p><div class="row"><a class="btn primary" data-go></a><button class="btn" type="button" data-close></button></div></div>`;
  el.querySelector('h3').textContent = t.h;
  el.querySelector('p').textContent = msg;
  const go = el.querySelector('[data-go]');
  go.textContent = t.cta; go.href = pricingUrl();
  go.addEventListener('click', () => track('pro_cta', { where: 'paywall', reason }));
  el.querySelector('[data-close]').textContent = t.close;
  const close = () => el.remove();
  el.querySelector('[data-close]').addEventListener('click', close);
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(el);
  el.querySelector('[data-go]').focus();
}

export function installGate() {
  const free = cfg.free;
  globalThis.CBT_GATE = {
    imgFiles(files, existing) {
      if (state.pro) return files;
      const room = Math.max(0, free.imageFilesPerRun - existing);
      if (files.length <= room) return files;
      paywall('img_files', { n: free.imageFilesPerRun });
      return files.slice(0, room);
    },
    imgPresets(ids) {
      if (state.pro || ids.length <= free.imagePresetsPerRun) return ids;
      paywall('img_presets', { n: free.imagePresetsPerRun });
      return ids.slice(0, free.imagePresetsPerRun);
    },
    zip() {
      if (state.pro) return true;
      paywall('zip');
      return false;
    },
  };
}
