import { applyI18n, resolveLang, setLang, t } from './i18n.js';
import { get, set } from './store.js';
import volume from './tools/volume.js';
import units from './tools/units.js';
import timezone from './tools/timezone.js';
import countries from './tools/countries.js';
import ustariff from './tools/ustariff.js';
import eutariff from './tools/eutariff.js';
import postal from './tools/postal.js';
import imgcompress from './tools/imgcompress.js';
import rates from './tools/rates.js';
import hs from './tools/hs.js';

const TOOLS = [volume, units, rates, timezone, countries, hs, ustariff, eutariff, postal, imgcompress];
const nav = document.getElementById('nav');
const panel = document.getElementById('panel');
const langSel = document.getElementById('lang');
let current = null;

if (new URLSearchParams(location.search).get('tab')) {
  document.body.classList.add('full');
  document.getElementById('open-tab').hidden = true;
}

function buildNav() {
  nav.innerHTML = '';
  for (const tool of TOOLS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = tool.id;
    b.textContent = t(tool.titleKey);
    b.addEventListener('click', () => select(tool.id));
    nav.appendChild(b);
  }
}

async function select(id, remember = true) {
  const tool = TOOLS.find((x) => x.id === id) || TOOLS[0];
  if (current && current.unmount) current.unmount();
  current = tool;
  nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === tool.id));
  // every tool gets a fresh container, so listeners from the previous tool die with it
  const box = document.createElement('div');
  panel.replaceChildren(box);
  document.querySelector('.content').scrollTop = 0;
  try {
    await tool.mount(box);
  } catch (e) {
    box.textContent = 'Error: ' + String((e && e.message) || e);
    console.error(e);
  }
  if (remember) set('lastTool', tool.id);
}

async function init() {
  const pref = await get('lang', 'auto');
  langSel.value = pref;
  setLang(resolveLang(pref));
  applyI18n();
  buildNav();
  const wanted = new URLSearchParams(location.search).get('tool');
  await select(wanted || await get('lastTool', 'volume'), false);
}

langSel.addEventListener('change', async () => {
  const pref = langSel.value;
  await set('lang', pref);
  setLang(resolveLang(pref));
  applyI18n();
  buildNav();
  await select(current ? current.id : 'volume', false);
});

document.getElementById('open-tab').addEventListener('click', () => {
  const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('popup.html?tab=1')
    : 'popup.html?tab=1';
  if (typeof chrome !== 'undefined' && chrome.tabs) chrome.tabs.create({ url });
  else window.open(url, '_blank');
});

document.addEventListener('cbt:goto', (e) => select(e.detail));

init();
