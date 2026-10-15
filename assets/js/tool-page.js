// Mounts one of the extension's tool modules (copied to /assets/app/) into the tool page.
import { cfg, track } from './track.js';
import { installGate } from './gate.js';
import { attachExport } from './export.js';
import { setLang } from '../app/i18n.js';
import { get, set } from '../app/store.js';
import { gotoTool, takePending } from '../app/bus.js';

globalThis.CBT_PROXY = '';
installGate();
setLang(cfg.lang);
document.documentElement.lang = cfg.lang === 'zh' ? 'zh-Hans' : 'en';

const mount = document.getElementById('tool-mount');
const params = new URLSearchParams(location.search);

// hand-off between tools: the extension tools fire "cbt:goto"; on the site that is a page navigation
document.addEventListener('cbt:goto', (e) => {
  const id = e.detail;
  if (id === cfg.tool) return;
  const slug = cfg.toolSlugs[id];
  if (!slug) return;
  const pending = takePending(id);
  const prefix = cfg.lang === 'zh' ? '/zh' : '';
  location.href = `${prefix}/tools/${slug}/` + (pending && pending.hs ? `?hs=${encodeURIComponent(pending.hs)}` : '');
});

async function run() {
  if (cfg.tool === 'imgcompress' && params.get('preset')) {
    const st = await get('imgState', {});
    await set('imgState', { ...st, mode: 'preset', sel: [params.get('preset')] });
  }
  if ((cfg.tool === 'ustariff' || cfg.tool === 'eutariff') && params.get('hs')) gotoTool(cfg.tool, { hs: params.get('hs').replace(/\D/g, '').slice(0, 10) });
  const mod = await import(`../app/tools/${cfg.tool}.js`);
  const box = document.createElement('div');
  mount.replaceChildren(box);
  await mod.default.mount(box);
  attachExport(box);
  let used = false;
  const once = () => { if (!used) { used = true; track('tool_use', { tool: cfg.tool }); } };
  box.addEventListener('input', once, { once: false });
  box.addEventListener('click', (e) => { if (e.target.closest('button, .btn, [data-copy]')) once(); });
  box.addEventListener('change', once);
  box.addEventListener('click', (e) => { if (e.target.closest('[data-copy]')) track('copy_result', { tool: cfg.tool }); });
}

run().catch((e) => {
  console.error(e);
  mount.innerHTML = '<p class="warn">Could not load the tool. Please reload the page.</p>';
});
