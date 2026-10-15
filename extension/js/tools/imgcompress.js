import { t, registerMessages, getLang } from '../i18n.js';
import { esc, toast } from '../dom.js';
import { get, set } from '../store.js';
import { compressImage, fmtBytes, extFor } from '../imgcore.js';
import { makeZip } from '../zip.js';
import { IMG_PLATFORMS, IMG_PRESETS_ASOF, findPreset, presetLabel } from '../data/imgpresets.js';

registerMessages({
  zh: {
    'nav.image': '图片压缩',
    'img.title': '图片压缩 / 平台尺寸',
    'img.notice': '全程在本机浏览器内处理，图片不会上传。可按亚马逊、Temu、速卖通等平台的尺寸批量出图（一张图同时输出多个平台），或只压缩体积；EXIF（含拍摄位置）会被清除。',
    'img.popupWarn': '在弹窗里选择文件时，浏览器可能会把弹窗关掉。建议在新标签页中使用，批量处理也更方便。',
    'img.openTab': '在新标签页打开',
    'img.drop': '把图片拖到这里，或点击选择（也可以直接 Ctrl+V 粘贴截图）',
    'img.dropSub': '支持 JPG / PNG / WebP / BMP，可一次选多张',
    'img.mode.preset': '平台预设（按平台尺寸出图）',
    'img.mode.compress': '仅压缩（保持原尺寸，限制体积）',
    'img.pick': '勾选要输出的尺寸，可多选；每张图会按每个勾选项各输出一份。',
    'img.refNote': '预设参数是根据各平台公开说明整理的参考值（{d}），平台规则会调整，请以卖家后台为准；也可在下方添加自定义预设。',
    'img.noPreset': '请先勾选至少一个平台预设',
    'img.fit': '适配方式',
    'img.fitPad': '补边（保留完整商品，推荐）',
    'img.fitCover': '居中裁切（填满画面）',
    'img.bg': '补边颜色',
    'img.bgWhite': '白色',
    'img.bgAuto': '取图片四角底色',
    'img.bgCustom': '自定义',
    'img.upscale': '原图较小时放大到目标尺寸',
    'img.trim': '自动裁掉多余空白边，让商品占画面',
    'img.cap': '统一限制 ≤',
    'img.capHint': 'MB（可选，与各平台上限取较小值）',
    'img.tpl': '文件名模板',
    'img.tplHelp': '可用 {name} 原文件名、{n} 序号（01、02…）、{preset} 预设编号、{size} 尺寸。例如 B0XXXXXXXX.PT{n}',
    'img.custom': '自定义预设',
    'img.customName': '名称',
    'img.customAdd': '添加',
    'img.customBad': '请填写名称、宽高（100–8000 px）和体积上限',
    'img.delPreset': '删除该自定义预设',
    'img.target': '目标大小 ≤',
    'img.targetUnit': 'MB',
    'img.targetHint': '按 {n} 字节计算，两种 MB 口径（1000² 或 1024²）都能通过',
    'img.format': '输出格式',
    'img.fmtAuto': '自动（推荐）',
    'img.fmtAutoCompress': '自动（推荐）：不透明→JPG，透明→WebP',
    'img.fmtJpeg': 'JPG（透明背景会填白）',
    'img.fmtWebp': 'WebP（体积更小）',
    'img.fmtPng': 'PNG（无损，只能靠缩小尺寸）',
    'img.floor': '画质下限',
    'img.floor92': '极高（0.92）',
    'img.floor85': '高（0.85，推荐）',
    'img.floor75': '中（0.75）',
    'img.scale': '画质到下限仍超出时，允许轻微缩小尺寸',
    'img.clear': '清空',
    'img.reprocess': '按当前设置重新处理',
    'img.zip': '全部下载 (ZIP)',
    'img.download': '下载',
    'img.remove': '移除',
    'img.working': '处理中…',
    'img.progress': '处理中 {d}/{n}…',
    'img.st.done': '已完成',
    'img.st.skipped': '已符合要求，保持原图',
    'img.st.warn': '已压缩，但画质低于下限',
    'img.st.fail': '未能压到目标大小',
    'img.st.unsupported': '不支持的格式',
    'img.st.error': '无法读取该图片',
    'img.quality': '画质 {q}',
    'img.scaled': '尺寸已缩小到 {p}%',
    'img.n.flatten': '透明背景已填充',
    'img.n.stripped': '已去除 EXIF（含拍摄位置）等元数据',
    'img.n.small': '原图最长边仅 {px}px，低于建议的 {min}px，放大后可能不够清晰',
    'img.n.upscaled': '已放大到目标尺寸',
    'img.n.trimmed': '已裁掉多余空白边',
    'img.n.autoBg': '补边使用了图片四角的底色',
    'img.n.gap': '原图不足以填满画面，边缘留有空白（可开启“放大”）',
    'img.failHint': '建议改用 JPG/WebP 输出、放宽目标大小，或手动裁剪后再试。',
    'img.failFixed': '尺寸固定为 {size}，在画质下限内压不到 {mb}。可放宽上限或降低画质下限。',
    'img.summary': '共 {n} 个文件，合计 {a} → {b}',
    'img.pasted': '已粘贴图片',
  },
  en: {
    'nav.image': 'Image Compressor',
    'img.title': 'Image Compressor / Marketplace Sizes',
    'img.notice': 'Everything runs locally in your browser — nothing is uploaded. Export batches at the sizes Amazon, Temu, AliExpress and others want (one picture → several platforms at once), or just compress. EXIF (incl. GPS location) is removed.',
    'img.popupWarn': 'Choosing files inside the popup may make the browser close it. Use a full tab instead — it is also better for batches.',
    'img.openTab': 'Open in a new tab',
    'img.drop': 'Drop images here or click to choose (you can also paste a screenshot with Ctrl+V)',
    'img.dropSub': 'JPG / PNG / WebP / BMP, multiple files allowed',
    'img.mode.preset': 'Marketplace presets (export at platform sizes)',
    'img.mode.compress': 'Compress only (keep size, cap file size)',
    'img.pick': 'Tick the sizes you need — every picture is exported once per ticked preset.',
    'img.refNote': 'Preset values are reference figures compiled from public seller guidelines ({d}). Platforms change their rules, so confirm in your seller dashboard — or add a custom preset below.',
    'img.noPreset': 'Tick at least one marketplace preset first',
    'img.fit': 'Fit',
    'img.fitPad': 'Pad (keep the whole product, recommended)',
    'img.fitCover': 'Crop to fill',
    'img.bg': 'Pad colour',
    'img.bgWhite': 'White',
    'img.bgAuto': 'Sample the picture corners',
    'img.bgCustom': 'Custom',
    'img.upscale': 'Enlarge small pictures to the target size',
    'img.trim': 'Auto-trim blank margins so the product fills',
    'img.cap': 'Cap everything at ≤',
    'img.capHint': 'MB (optional, the smaller of this and each preset\'s cap wins)',
    'img.tpl': 'File name',
    'img.tplHelp': 'Tokens: {name} original name, {n} sequence (01, 02…), {preset} preset id, {size} size. Example: B0XXXXXXXX.PT{n}',
    'img.custom': 'Custom presets',
    'img.customName': 'Name',
    'img.customAdd': 'Add',
    'img.customBad': 'Enter a name, width/height (100–8000 px) and a size cap',
    'img.delPreset': 'Delete this custom preset',
    'img.target': 'Target size ≤',
    'img.targetUnit': 'MB',
    'img.targetHint': 'Calculated as {n} bytes, so it passes under both MB conventions (1000² or 1024²)',
    'img.format': 'Output format',
    'img.fmtAuto': 'Auto (recommended)',
    'img.fmtAutoCompress': 'Auto (recommended): opaque → JPG, transparent → WebP',
    'img.fmtJpeg': 'JPG (transparency is filled with white)',
    'img.fmtWebp': 'WebP (smaller files)',
    'img.fmtPng': 'PNG (lossless — only resizing can shrink it)',
    'img.floor': 'Quality floor',
    'img.floor92': 'Very high (0.92)',
    'img.floor85': 'High (0.85, recommended)',
    'img.floor75': 'Medium (0.75)',
    'img.scale': 'If the floor is not enough, allow a slight resize',
    'img.clear': 'Clear',
    'img.reprocess': 'Re-run with current settings',
    'img.zip': 'Download all (ZIP)',
    'img.download': 'Download',
    'img.remove': 'Remove',
    'img.working': 'Working…',
    'img.progress': 'Working {d}/{n}…',
    'img.st.done': 'Done',
    'img.st.skipped': 'Already fine — original kept',
    'img.st.warn': 'Compressed, but below the quality floor',
    'img.st.fail': 'Could not reach the target size',
    'img.st.unsupported': 'Unsupported format',
    'img.st.error': 'Could not read this image',
    'img.quality': 'Quality {q}',
    'img.scaled': 'Resized to {p}%',
    'img.n.flatten': 'Transparent background filled',
    'img.n.stripped': 'EXIF (incl. GPS location) and other metadata removed',
    'img.n.small': 'Source long side is only {px}px, below the suggested {min}px — may look soft once enlarged',
    'img.n.upscaled': 'Enlarged to the target size',
    'img.n.trimmed': 'Blank margins trimmed',
    'img.n.autoBg': 'Pad colour sampled from the picture corners',
    'img.n.gap': 'The picture cannot fill the canvas, so edges stay empty (turn on “Enlarge”)',
    'img.failHint': 'Try JPG/WebP output, a looser target, or crop the image first.',
    'img.failFixed': 'Size is fixed at {size}, and {mb} cannot be reached within the quality floor. Loosen the cap or lower the quality floor.',
    'img.summary': '{n} files, {a} → {b}',
    'img.pasted': 'Pasted image',
  },
});

const MB = 1000000; // decimal MB: satisfies both 2,000,000 and 2×1024×1024 style limits
const DEFAULTS = {
  mode: 'preset', mb: 2, fmt: 'auto', floor: '0.85', scale: true,
  sel: ['amazon-2000'], fit: 'pad', bgMode: 'white', bgColor: '#ffffff', upscale: true, trim: false, fill: 85, cap: '', tpl: '{name}',
};

export default {
  id: 'imgcompress',
  titleKey: 'nav.image',
  async mount(el) {
    const lang = getLang();
    const st = Object.assign({}, DEFAULTS, await get('imgState', {}));
    let custom = await get('imgCustom', []);
    if (!Array.isArray(custom)) custom = [];
    const isTab = !!new URLSearchParams(location.search).get('tab');
    const sources = []; // { sid, n, file, bad }
    const outputs = []; // { id, src, job, node, r, alive }
    const queue = [];
    let seq = 0;
    let srcSeq = 0;
    let running = false;
    let alive = true;
    let progress = { done: 0, total: 0 };
    this._kill = () => { alive = false; };

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('img.title'))}</h2>
      <div class="pad">
        <div class="notice">${esc(t('img.notice'))}</div>
        ${isTab ? '' : `<div class="warn" style="margin-top:0">${esc(t('img.popupWarn'))}
          <button class="btn small" id="img-tab" type="button" style="margin-left:8px">${esc(t('img.openTab'))}</button></div>`}
        <div class="dropzone" id="img-drop" tabindex="0">
          <div class="drop-main">${esc(t('img.drop'))}</div>
          <div class="muted small">${esc(t('img.dropSub'))}</div>
          <input id="img-file" type="file" accept="image/jpeg,image/png,image/webp,image/bmp" multiple hidden>
        </div>

        <div class="radios img-modes">
          <label class="radio"><input type="radio" name="imode" value="preset"> ${esc(t('img.mode.preset'))}</label>
          <label class="radio"><input type="radio" name="imode" value="compress"> ${esc(t('img.mode.compress'))}</label>
        </div>

        <div id="img-m-preset">
          <div class="muted small">${esc(t('img.pick'))}</div>
          <div class="plat-grid" id="img-plats"></div>
          <div class="img-custom">
            <b class="small">${esc(t('img.custom'))}</b>
            <input id="cp-name" type="text" placeholder="${esc(t('img.customName'))}" style="width:110px">
            <input id="cp-w" type="number" min="100" max="8000" placeholder="W" class="s" style="width:70px">
            <span class="muted">×</span>
            <input id="cp-h" type="number" min="100" max="8000" placeholder="H" class="s" style="width:70px">
            <span class="muted">≤</span>
            <input id="cp-mb" type="number" min="0.05" step="0.1" placeholder="MB" class="s" style="width:64px">
            <span class="muted">MB</span>
            <button class="btn small" id="cp-add" type="button">${esc(t('img.customAdd'))}</button>
          </div>
          <div class="img-opts img-opts-p">
            <label>${esc(t('img.fit'))}
              <select id="img-fit"><option value="pad">${esc(t('img.fitPad'))}</option><option value="cover">${esc(t('img.fitCover'))}</option></select></label>
            <label>${esc(t('img.bg'))}
              <select id="img-bg"><option value="white">${esc(t('img.bgWhite'))}</option><option value="auto">${esc(t('img.bgAuto'))}</option><option value="custom">${esc(t('img.bgCustom'))}</option></select>
              <input id="img-bgc" type="color" value="#ffffff" hidden></label>
            <label class="check"><input id="img-upscale" type="checkbox"> ${esc(t('img.upscale'))}</label>
            <label class="check"><input id="img-trim" type="checkbox"> ${esc(t('img.trim'))}
              <input id="img-fill" type="number" min="40" max="100" step="1" style="width:58px"> %</label>
            <label>${esc(t('img.cap'))} <input id="img-cap" type="number" min="0.05" step="0.1" style="width:70px"> ${esc(t('img.capHint'))}</label>
            <label>${esc(t('img.tpl'))} <input id="img-tpl" type="text" style="width:190px" title="${esc(t('img.tplHelp'))}"> <span class="help" title="${esc(t('img.tplHelp'))}">?</span></label>
          </div>
        </div>

        <div id="img-m-compress">
          <div class="img-opts">
            <label>${esc(t('img.target'))}
              <input id="img-mb" type="number" min="0.05" step="0.1" style="width:76px"> ${esc(t('img.targetUnit'))}</label>
            <label class="check"><input id="img-scale" type="checkbox"> ${esc(t('img.scale'))}</label>
          </div>
          <div class="muted small" id="img-hint"></div>
        </div>

        <div class="img-opts" style="margin-top:8px">
          <label>${esc(t('img.format'))}
            <select id="img-fmt"></select></label>
          <label>${esc(t('img.floor'))}
            <select id="img-floor">
              <option value="0.92">${esc(t('img.floor92'))}</option>
              <option value="0.85">${esc(t('img.floor85'))}</option>
              <option value="0.75">${esc(t('img.floor75'))}</option>
            </select></label>
        </div>

        <div id="img-preset-foot">
          <div class="muted small" id="img-sel-notes"></div>
          <div class="muted small foot">${esc(t('img.refNote', { d: IMG_PRESETS_ASOF }))}</div>
        </div>

        <div class="img-bar" id="img-bar" hidden>
          <span id="img-sum" class="muted"></span>
          <span class="spacer"></span>
          <button class="btn small" id="img-redo" type="button">${esc(t('img.reprocess'))}</button>
          <button class="btn small" id="img-zip" type="button">${esc(t('img.zip'))}</button>
          <button class="btn small ghost" id="img-clear" type="button">${esc(t('img.clear'))}</button>
        </div>
        <div id="img-list"></div>
      </div>`;

    const $ = (id) => el.querySelector('#' + id);

    // ---------- preset picker ----------
    function renderPlatforms() {
      const groups = IMG_PLATFORMS.map((p) => ({
        key: p.id, title: lang === 'zh' ? p.zh : p.en,
        items: p.presets.map((x) => ({ id: x.id, name: lang === 'zh' ? x.zh : x.en, w: x.w, h: x.h, mb: x.mb, note: lang === 'zh' ? x.note.zh : x.note.en, del: false })),
      }));
      if (custom.length) {
        groups.push({
          key: 'custom', title: lang === 'zh' ? '自定义' : 'Custom',
          items: custom.map((c) => ({ id: c.id, name: c.name, w: c.w, h: c.h, mb: c.mb, note: '', del: true })),
        });
      }
      $('img-plats').innerHTML = groups.map((g) => `
        <div class="plat"><div class="plat-t">${esc(g.title)}</div>
          ${g.items.map((i) => `<label title="${esc(i.note)}"><input type="checkbox" data-preset="${esc(i.id)}" ${st.sel.includes(i.id) ? 'checked' : ''}>
            <span>${esc(i.name)} <span class="sz">${i.w}×${i.h} · ≤${esc(String(i.mb))}MB</span></span>
            ${i.del ? `<button class="x" type="button" data-delpreset="${esc(i.id)}" title="${esc(t('img.delPreset'))}">×</button>` : ''}</label>`).join('')}
        </div>`).join('');
      renderSelNotes();
    }

    function renderSelNotes() {
      const lines = [];
      for (const id of st.sel) {
        const f = findPreset(id, custom);
        if (!f) continue;
        const note = f.platform.id === 'custom' ? '' : (lang === 'zh' ? f.preset.note.zh : f.preset.note.en);
        if (note) lines.push(`<div><b>${esc(presetLabel(f.platform, f.preset, lang))}</b>：${esc(note)}</div>`);
      }
      $('img-sel-notes').innerHTML = lines.join('');
    }

    function setMode(m) {
      st.mode = m;
      el.querySelectorAll('input[name=imode]').forEach((r) => { r.checked = r.value === m; });
      $('img-m-preset').hidden = m !== 'preset';
      $('img-m-compress').hidden = m !== 'compress';
      $('img-preset-foot').hidden = m !== 'preset';
      fillFormats();
    }

    function fillFormats() {
      const sel = $('img-fmt');
      const cur = st.fmt;
      sel.innerHTML = `<option value="auto">${esc(st.mode === 'preset' ? t('img.fmtAuto') + ' · JPG' : t('img.fmtAutoCompress'))}</option>
        <option value="jpeg">${esc(t('img.fmtJpeg'))}</option><option value="webp">${esc(t('img.fmtWebp'))}</option><option value="png">${esc(t('img.fmtPng'))}</option>`;
      sel.value = cur;
    }

    const limitBytes = () => Math.round(Math.max(0.05, parseFloat($('img-mb').value) || 2) * MB);
    const refreshHint = () => { $('img-hint').textContent = t('img.targetHint', { n: limitBytes().toLocaleString('en-US') }); };

    function readOpts() {
      st.fmt = $('img-fmt').value;
      st.floor = $('img-floor').value;
      st.mb = parseFloat($('img-mb').value) || 2;
      st.scale = $('img-scale').checked;
      st.fit = $('img-fit').value;
      st.bgMode = $('img-bg').value;
      st.bgColor = $('img-bgc').value;
      st.upscale = $('img-upscale').checked;
      st.trim = $('img-trim').checked;
      st.fill = Math.min(100, Math.max(40, parseFloat($('img-fill').value) || 85));
      st.cap = $('img-cap').value;
      st.tpl = $('img-tpl').value || '{name}';
    }
    const saveState = () => set('imgState', st);

    // apply saved state to the controls
    $('img-mb').value = st.mb;
    $('img-scale').checked = st.scale;
    $('img-floor').value = st.floor;
    $('img-fit').value = st.fit;
    $('img-bg').value = st.bgMode;
    $('img-bgc').value = st.bgColor;
    $('img-bgc').hidden = st.bgMode !== 'custom';
    $('img-upscale').checked = st.upscale;
    $('img-trim').checked = st.trim;
    $('img-fill').value = st.fill;
    $('img-cap').value = st.cap;
    $('img-tpl').value = st.tpl;
    st.sel = st.sel.filter((id) => !!findPreset(id, custom));
    renderPlatforms();
    setMode(st.mode);
    refreshHint();

    // ---------- jobs ----------
    function currentJobs() {
      if (st.mode === 'compress') {
        return [{ preset: null, opts: { limit: limitBytes(), fmt: st.fmt, floorQ: parseFloat(st.floor), allowScale: st.scale } }];
      }
      const cap = parseFloat(st.cap);
      return st.sel.map((id) => findPreset(id, custom)).filter(Boolean).map((f) => {
        const mb = isFinite(cap) && cap > 0 ? Math.min(f.preset.mb, cap) : f.preset.mb;
        const bg = st.bgMode === 'auto' ? 'auto' : st.bgMode === 'custom' ? st.bgColor : '#ffffff';
        return {
          preset: f,
          opts: {
            limit: Math.round(mb * MB), fmt: st.fmt, floorQ: parseFloat(st.floor),
            target: { w: f.preset.w, h: f.preset.h, fit: st.fit, bg, upscale: st.upscale, trim: st.trim, fill: st.fill / 100, min: f.preset.min || 0 },
          },
        };
      });
    }

    const multiPreset = () => new Set(outputs.filter((o) => o.job.preset).map((o) => o.job.preset.preset.id)).size > 1;

    function stemOf(o) {
      const base = o.src.file.name.replace(/\.[^.]+$/, '');
      if (!o.job.preset) return `${base}-compressed`;
      const tpl = st.tpl || '{name}';
      const p = o.job.preset.preset;
      const s = tpl.replace(/\{name\}/g, base).replace(/\{n\}/g, String(o.src.n).padStart(2, '0'))
        .replace(/\{preset\}/g, p.id).replace(/\{size\}/g, `${p.w}x${p.h}`)
        .replace(/[\\/:*?"<>|]+/g, '_').trim();
      return s || base;
    }
    const folderOf = (o) => (o.job.preset ? `${o.job.preset.platform.id}_${o.job.preset.preset.w}x${o.job.preset.preset.h}` : '');
    function fileNameOf(o, inZip) {
      const orig = (o.src.file.name.match(/\.([^.]+)$/) || [])[1];
      const ext = o.r.status === 'skipped' && orig ? orig : extFor(o.r.type);
      const stem = stemOf(o);
      if (o.r.status === 'skipped' && !o.job.preset) return o.src.file.name;
      if (inZip || !o.job.preset || !multiPreset()) return `${stem}.${ext}`;
      return `${stem}_${o.job.preset.preset.id}.${ext}`;
    }

    // ---------- rendering ----------
    function renderSummary() {
      const done = outputs.filter((x) => x.r && x.r.blob);
      $('img-bar').hidden = outputs.length === 0;
      if (progress.total && progress.done < progress.total) { $('img-sum').textContent = t('img.progress', { d: progress.done, n: progress.total }); return; }
      if (!done.length) { $('img-sum').textContent = ''; return; }
      const a = done.reduce((s, x) => s + x.r.origSize, 0);
      const b = done.reduce((s, x) => s + x.r.size, 0);
      $('img-sum').textContent = t('img.summary', { n: done.length, a: fmtBytes(a), b: fmtBytes(b) });
    }

    function detail(r, preset) {
      const bits = [];
      if (r.w0) bits.push(r.w && (r.w !== r.w0 || r.h !== r.h0) ? `${r.w0}×${r.h0} → ${r.w}×${r.h}` : `${r.w0}×${r.h0}`);
      if (r.blob) {
        const pct = r.size < r.origSize ? ` (−${Math.round((1 - r.size / r.origSize) * 100)}%)` : '';
        bits.push(`${fmtBytes(r.origSize)} → <b>${fmtBytes(r.size)}</b>${pct}`);
      } else bits.push(fmtBytes(r.origSize));
      if (r.q) bits.push(t('img.quality', { q: r.q.toFixed(2) }));
      if (!preset && r.notes.includes('scaled')) bits.push(t('img.scaled', { p: Math.round(r.scale * 100) }));
      return bits.join(' · ');
    }

    function paint(o) {
      const { r, node } = o;
      const cls = { done: 'ok', skipped: 'ok', warn: 'warnc', fail: 'bad', unsupported: 'bad', error: 'bad' }[r.status];
      const extra = [];
      if (r.notes.includes('small') && o.job.preset) extra.push({ warn: true, text: t('img.n.small', { px: r.srcLong, min: o.job.preset.preset.min }) });
      if (r.notes.includes('gap')) extra.push({ warn: true, text: t('img.n.gap') });
      if (r.notes.includes('flatten')) extra.push({ text: t('img.n.flatten') });
      if (r.notes.includes('upscaled')) extra.push({ text: t('img.n.upscaled') });
      if (r.notes.includes('trimmed')) extra.push({ text: t('img.n.trimmed') });
      if (r.notes.includes('autoBg')) extra.push({ text: t('img.n.autoBg') });
      if (r.status === 'done' || r.status === 'warn') extra.push({ text: t('img.n.stripped') });
      if (r.status === 'fail') {
        extra.push({ warn: true, text: o.job.preset
          ? t('img.failFixed', { size: `${o.job.preset.preset.w}×${o.job.preset.preset.h}`, mb: `${(o.job.opts.limit / MB).toFixed(2)}MB` })
          : t('img.failHint') });
      }
      const tag = o.job.preset ? `<span class="img-tag">${esc(presetLabel(o.job.preset.platform, o.job.preset.preset, lang))}</span>` : '';
      node.innerHTML = `
        <div class="img-thumb">${r.thumb ? `<img src="${esc(r.thumb)}" alt="">` : ''}</div>
        <div class="img-info">
          <div class="img-name" title="${esc(r.name)}">${esc(r.name)} ${tag}</div>
          <div class="img-detail">${detail(r, o.job.preset)}</div>
          <div class="img-status ${cls}">${esc(t('img.st.' + r.status))}</div>
          ${extra.length ? `<div class="muted small">${extra.map((x) => (x.warn ? `<span class="warn-text">${esc(x.text)}</span>` : esc(x.text))).join(' · ')}</div>` : ''}
        </div>
        <div class="img-act">${r.blob ? `<button class="btn small" type="button" data-dl="${o.id}">${esc(t('img.download'))}</button>` : ''}
          <button class="x" type="button" data-rm="${o.id}" title="${esc(t('img.remove'))}">×</button></div>`;
    }

    function save(blob, name) {
      const a = document.createElement('a');
      const u = URL.createObjectURL(blob);
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
    }

    // ---------- queue ----------
    async function pump() {
      if (running) return;
      running = true;
      while (queue.length && alive) {
        const o = queue.shift();
        if (!o.alive) { progress.total -= 1; continue; }
        if (o.src.bad) { // unsupported / unreadable: one row is enough
          o.alive = false;
          o.node.remove();
          outputs.splice(outputs.indexOf(o), 1);
          progress.total -= 1;
          continue;
        }
        renderSummary();
        await new Promise((r) => setTimeout(r, 20)); // let the browser paint
        const r = await compressImage(o.src.file, o.job.opts);
        if (!alive) break;
        if (r.status === 'unsupported' || r.status === 'error') o.src.bad = true;
        o.r = r;
        progress.done += 1;
        if (o.alive) paint(o);
        renderSummary();
      }
      running = false;
      if (!queue.length) progress = { done: 0, total: 0 };
      if (alive) renderSummary();
    }

    function enqueue(src, jobs) {
      for (const job of jobs) {
        const o = {
          id: ++seq, src, job, alive: true, r: { name: src.file.name, origSize: src.file.size, notes: [] }, node: document.createElement('div'),
        };
        o.node.className = 'img-row';
        const tag = job.preset ? `<span class="img-tag">${esc(presetLabel(job.preset.platform, job.preset.preset, lang))}</span>` : '';
        o.node.innerHTML = `<div class="img-thumb"></div><div class="img-info"><div class="img-name">${esc(src.file.name)} ${tag}</div>
          <div class="img-detail muted">${esc(t('img.working'))}</div></div><div class="img-act"></div>`;
        $('img-list').appendChild(o.node);
        outputs.push(o);
        queue.push(o);
        progress.total += 1;
      }
      $('img-bar').hidden = false;
      renderSummary();
      pump();
    }

    function addFiles(files) {
      readOpts();
      const jobs = currentJobs();
      if (!jobs.length) { toast(t('img.noPreset')); return; }
      saveState();
      for (const file of files) {
        const src = { sid: ++srcSeq, n: srcSeq, file, bad: false };
        sources.push(src);
        enqueue(src, jobs);
      }
    }

    function reprocess() {
      readOpts();
      const jobs = currentJobs();
      if (!jobs.length) { toast(t('img.noPreset')); return; }
      saveState();
      queue.length = 0;
      outputs.forEach((o) => { o.alive = false; });
      outputs.length = 0;
      $('img-list').innerHTML = '';
      progress = { done: 0, total: 0 };
      sources.forEach((s) => { s.bad = false; });
      for (const src of sources) enqueue(src, jobs);
    }

    // ---------- events ----------
    const drop = $('img-drop');
    const fileInput = $('img-file');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { const f = Array.from(fileInput.files); fileInput.value = ''; if (f.length) addFiles(f); });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => {
      const f = Array.from(e.dataTransfer.files).filter((x) => x.type.startsWith('image/') || x.name);
      if (f.length) addFiles(f);
    });
    this._onPaste = (e) => {
      const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      toast(t('img.pasted'));
      addFiles(files.map((f, i) => (f.name && f.name !== 'image.png' ? f : new File([f], `pasted-${Date.now()}-${i + 1}.${f.type.split('/')[1] || 'png'}`, { type: f.type }))));
    };
    document.addEventListener('paste', this._onPaste);

    el.querySelectorAll('input[name=imode]').forEach((r) => r.addEventListener('change', () => { setMode(r.value); saveState(); }));
    $('img-plats').addEventListener('change', (e) => {
      const c = e.target.closest('[data-preset]');
      if (!c) return;
      st.sel = Array.from($('img-plats').querySelectorAll('[data-preset]:checked')).map((x) => x.dataset.preset);
      renderSelNotes();
      saveState();
    });
    $('img-plats').addEventListener('click', (e) => {
      const d = e.target.closest('[data-delpreset]');
      if (!d) return;
      e.preventDefault();
      custom = custom.filter((c) => c.id !== d.dataset.delpreset);
      st.sel = st.sel.filter((id) => id !== d.dataset.delpreset);
      set('imgCustom', custom);
      saveState();
      renderPlatforms();
    });
    $('cp-add').addEventListener('click', () => {
      const name = $('cp-name').value.trim();
      const w = Math.round(parseFloat($('cp-w').value));
      const h = Math.round(parseFloat($('cp-h').value));
      const mb = parseFloat($('cp-mb').value);
      if (!name || !(w >= 100 && w <= 8000) || !(h >= 100 && h <= 8000) || !(mb > 0)) { toast(t('img.customBad')); return; }
      const id = `c-${Date.now().toString(36)}`;
      custom.push({ id, name, w, h, mb });
      st.sel.push(id);
      set('imgCustom', custom);
      saveState();
      ['cp-name', 'cp-w', 'cp-h', 'cp-mb'].forEach((x) => { $(x).value = ''; });
      renderPlatforms();
    });
    $('img-bg').addEventListener('change', () => { $('img-bgc').hidden = $('img-bg').value !== 'custom'; });
    ['img-mb', 'img-fmt', 'img-floor', 'img-scale', 'img-fit', 'img-bg', 'img-bgc', 'img-upscale', 'img-trim', 'img-fill', 'img-cap', 'img-tpl']
      .forEach((id) => $(id).addEventListener('change', () => { readOpts(); refreshHint(); saveState(); }));
    $('img-mb').addEventListener('input', () => { refreshHint(); });
    $('img-redo').addEventListener('click', reprocess);

    el.addEventListener('click', (e) => {
      const dl = e.target.closest('[data-dl]');
      if (dl) {
        const o = outputs.find((x) => x.id === +dl.dataset.dl);
        if (o && o.r.blob) save(o.r.blob, fileNameOf(o, false));
        return;
      }
      const rm = e.target.closest('[data-rm]');
      if (rm) {
        const o = outputs.find((x) => x.id === +rm.dataset.rm);
        if (!o) return;
        o.alive = false;
        o.node.remove();
        outputs.splice(outputs.indexOf(o), 1);
        if (!outputs.some((x) => x.src === o.src)) sources.splice(sources.indexOf(o.src), 1);
        renderSummary();
      }
    });
    $('img-zip').addEventListener('click', async () => {
      readOpts();
      const used = new Set();
      const files = [];
      for (const o of outputs.slice().sort((a, b) => a.id - b.id)) {
        if (!o.r.blob) continue;
        const folder = folderOf(o);
        let name = fileNameOf(o, true);
        let n = 1;
        const full = () => (folder ? `${folder}/${name}` : name);
        while (used.has(full().toLowerCase())) { n += 1; name = name.replace(/(-\d+)?(\.[^.]+)$/, `-${n}$2`); }
        used.add(full().toLowerCase());
        files.push({ name: full(), blob: o.r.blob });
      }
      if (files.length) save(await makeZip(files), `images-${new Date().toISOString().slice(0, 10)}.zip`);
    });
    $('img-clear').addEventListener('click', () => {
      queue.length = 0;
      outputs.forEach((o) => { o.alive = false; });
      outputs.length = 0;
      sources.length = 0;
      srcSeq = 0;
      progress = { done: 0, total: 0 };
      $('img-list').innerHTML = '';
      renderSummary();
    });
    const tabBtn = el.querySelector('#img-tab');
    if (tabBtn) {
      tabBtn.addEventListener('click', () => {
        const rel = 'popup.html?tab=1&tool=imgcompress';
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) chrome.tabs.create({ url: chrome.runtime.getURL(rel) });
        else window.open(rel, '_blank');
      });
    }
  },
  unmount() {
    if (this._onPaste) document.removeEventListener('paste', this._onPaste);
    if (this._kill) this._kill();
  },
};
