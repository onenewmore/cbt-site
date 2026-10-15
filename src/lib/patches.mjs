// Build-time patches applied to the COPY of the extension's JS so the extension itself stays untouched.
// Every patch asserts that its anchor exists, so upstream drift fails the build loudly instead of silently.

function mustReplace(src, from, to, label) {
  if (!src.includes(from)) throw new Error(`patch "${label}": anchor not found — the extension code changed; update src/lib/patches.mjs`);
  return src.replace(from, to);
}

// 1) dom.js: route third-party API calls through our same-origin proxy (CORS-free, cached, polite User-Agent).
export function patchDom(src) {
  let out = mustReplace(src, 'const res = await fetch(url, { signal: ctrl.signal, headers });', 'const res = await fetch(cbtRewrite(url), { signal: ctrl.signal, headers });', 'dom.fetch');
  out += `
// ---- added by the website build: same-origin proxy for allow-listed data providers ----
const CBT_HOSTS = {
  'https://hts.usitc.gov': 'hts',
  'https://api.zippopotam.us': 'zip',
  'https://nominatim.openstreetmap.org': 'osm',
  'https://open.er-api.com': 'er',
  'https://cdn.jsdelivr.net': 'cdn',
  'https://api.frankfurter.dev': 'fx',
};
function cbtRewrite(u) {
  try {
    if (typeof globalThis.CBT_PROXY !== 'string') return u;
    const x = new URL(u);
    const k = CBT_HOSTS[x.origin];
    return k ? globalThis.CBT_PROXY + '/api/p/' + k + x.pathname + x.search : u;
  } catch { return u; }
}
`;
  return out;
}

// 2) imgcompress.js: free-tier limits (files / presets per run, ZIP). Gate functions live in site/tool-page.js (window.CBT_GATE).
export function patchImg(src) {
  let out = mustReplace(src,
    '    function addFiles(files) {\n      readOpts();',
    '    function addFiles(files) {\n      if (globalThis.CBT_GATE && globalThis.CBT_GATE.imgFiles) { files = globalThis.CBT_GATE.imgFiles(files, sources.length); if (!files.length) return; }\n      readOpts();',
    'img.addFiles');
  out = mustReplace(out,
    '      return st.sel.map((id) => findPreset(id, custom)).filter(Boolean).map((f) => {',
    '      return (globalThis.CBT_GATE && globalThis.CBT_GATE.imgPresets ? globalThis.CBT_GATE.imgPresets(st.sel) : st.sel).map((id) => findPreset(id, custom)).filter(Boolean).map((f) => {',
    'img.presets');
  out = mustReplace(out,
    "    $('img-zip').addEventListener('click', async () => {",
    "    $('img-zip').addEventListener('click', async () => {\n      if (globalThis.CBT_GATE && globalThis.CBT_GATE.zip && !globalThis.CBT_GATE.zip()) return;",
    'img.zip');
  // website: the tool always runs in a full page, so hide the "popup may close" notice and the "open in new tab" button
  out = mustReplace(out, "const isTab = !!new URLSearchParams(location.search).get('tab');", 'const isTab = true;', 'img.isTab');
  return out;
}

export const PATCHES = { 'dom.js': patchDom, 'tools/imgcompress.js': patchImg };
