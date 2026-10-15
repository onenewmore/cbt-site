// Image processing core. Runs 100% locally with <canvas>; nothing is uploaded anywhere.
//
// Two modes share one quality search:
//
//  A) compress only (no `target`): keep the pixel size, find the highest JPEG/WebP quality (<= MAX_Q) that fits the
//     limit; if even the quality floor does not fit, shrink slightly (never below MIN_SIDE) and use the spare budget
//     to raise quality again; last resort is going below the floor (flagged). Files that already fit are untouched.
//
//  B) platform preset (`target` = {w,h,fit,bg,upscale,trim,fill,min}): first compose an exact w×h canvas
//     (pad with a background colour, or crop to fill; optionally trim blank margins so the product fills N% of the
//     frame), then search the quality that fits the size cap. The pixel size is NEVER changed in this mode.

export const MAX_Q = 0.95;
export const MIN_SIDE = 800;

export function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

const EXT = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
export const extFor = (type) => EXT[type] || 'jpg';

const SUPPORTED = /^image\/(jpeg|png|webp|bmp)$/;

function smallCanvas(bitmap, maxSide) {
  const s = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * s));
  const h = Math.max(1, Math.round(bitmap.height * s));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  return { ctx, w, h, s };
}

async function hasTransparency(bitmap) {
  const { ctx, w, h } = smallCanvas(bitmap, 512);
  const d = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

/**
 * Looks at the four corners (background colour) and finds the bounding box of everything that differs from it.
 * @returns {{ bg: number[]|null, transparent: boolean, box: {x,y,w,h}|null }}
 *   bg = average corner colour if the corners agree, else null; box = content rectangle in bitmap pixels
 *   (null when it cannot be told apart from the background or would not change anything).
 */
export function analyzeImage(bitmap, tol = 22) {
  const { ctx, w, h, s } = smallCanvas(bitmap, 480);
  const px = ctx.getImageData(0, 0, w, h).data;
  const at = (x, y) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2], px[i + 3]]; };
  const patch = Math.max(1, Math.min(3, Math.floor(Math.min(w, h) / 20)));
  const corners = [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]].map(([cx, cy]) => {
    const acc = [0, 0, 0, 0];
    for (let y = 0; y < patch; y++) for (let x = 0; x < patch; x++) { const p = at(cx + x, cy + y); for (let k = 0; k < 4; k++) acc[k] += p[k]; }
    return acc.map((v) => v / (patch * patch));
  });
  const transparent = corners.every((c) => c[3] < 40);
  const opaque = corners.every((c) => c[3] > 215);
  let bg = null;
  if (opaque) {
    const spread = [0, 1, 2].map((k) => Math.max(...corners.map((c) => c[k])) - Math.min(...corners.map((c) => c[k])));
    if (Math.max(...spread) <= 28) bg = [0, 1, 2].map((k) => Math.round(corners.reduce((a, c) => a + c[k], 0) / 4));
  }
  if (!bg && !transparent) return { bg: null, transparent: false, box: null };

  const isBg = (p) => p[3] < 16 || (!transparent && Math.abs(p[0] - bg[0]) <= tol && Math.abs(p[1] - bg[1]) <= tol && Math.abs(p[2] - bg[2]) <= tol);
  const rowCount = new Array(h).fill(0);
  const colCount = new Array(w).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isBg(at(x, y))) { rowCount[y]++; colCount[x]++; }
    }
  }
  const needR = Math.max(2, Math.round(w * 0.002));
  const needC = Math.max(2, Math.round(h * 0.002));
  let y0 = rowCount.findIndex((v) => v >= needR);
  let x0 = colCount.findIndex((v) => v >= needC);
  let y1 = h - 1 - [...rowCount].reverse().findIndex((v) => v >= needR);
  let x1 = w - 1 - [...colCount].reverse().findIndex((v) => v >= needC);
  if (y0 < 0 || x0 < 0 || y1 < y0 || x1 < x0) return { bg, transparent, box: null };
  const grow = 1; // one small-pixel safety margin
  x0 = Math.max(0, x0 - grow); y0 = Math.max(0, y0 - grow);
  x1 = Math.min(w - 1, x1 + grow); y1 = Math.min(h - 1, y1 + grow);
  const box = {
    x: Math.floor(x0 / s), y: Math.floor(y0 / s),
    w: Math.min(bitmap.width, Math.ceil((x1 - x0 + 1) / s)), h: Math.min(bitmap.height, Math.ceil((y1 - y0 + 1) / s)),
  };
  box.w = Math.min(box.w, bitmap.width - box.x);
  box.h = Math.min(box.h, bitmap.height - box.y);
  const unchanged = box.w >= bitmap.width * 0.98 && box.h >= bitmap.height * 0.98;
  return { bg, transparent, box: unchanged ? null : box };
}

const hex = (rgb) => `#${rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;

// Compose the exact w×h picture a marketplace wants.
function renderTarget(bitmap, tg) {
  const W = bitmap.width;
  const H = bitmap.height;
  const notes = [];
  const needInfo = tg.trim || tg.bg === 'auto';
  const info = needInfo ? analyzeImage(bitmap) : { bg: null, box: null };

  let fill = '#ffffff';
  if (tg.bg === 'auto') {
    if (info.bg) { fill = hex(info.bg); notes.push('autoBg'); }
  } else if (/^#[0-9a-f]{6}$/i.test(tg.bg || '')) fill = tg.bg;

  let sx = 0; let sy = 0; let sw = W; let sh = H;
  if (tg.trim && tg.fit !== 'cover' && info.box) {
    ({ x: sx, y: sy, w: sw, h: sh } = info.box);
    notes.push('trimmed');
  }
  const k = tg.trim && tg.fit !== 'cover' ? Math.min(1, Math.max(0.3, tg.fill || 0.85)) : 1;
  let s = tg.fit === 'cover' ? Math.max(tg.w / sw, tg.h / sh) : Math.min((tg.w * k) / sw, (tg.h * k) / sh);
  if (!tg.upscale && s > 1) s = 1;
  const dw = Math.max(1, Math.round(sw * s));
  const dh = Math.max(1, Math.round(sh * s));
  const dx = Math.round((tg.w - dw) / 2);
  const dy = Math.round((tg.h - dh) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = tg.w;
  canvas.height = tg.h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, tg.w, tg.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);

  const srcLong = Math.max(sw, sh);
  if (s > 1.0001) notes.push('upscaled');
  if (tg.min && srcLong < tg.min) notes.push('small');
  if (tg.fit === 'cover' && (dw < tg.w || dh < tg.h)) notes.push('gap');
  return { canvas, notes, srcLong, scale: s };
}

function makeThumb(src, w, h) {
  try {
    const s = Math.min(1, 128 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * s));
    c.height = Math.max(1, Math.round(h * s));
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', 0.7);
  } catch {
    return '';
  }
}

// Quality (and, in compress mode, size) search shared by both modes.
async function search({ src, W, H, type, flatten, limit, floorQ, allowScale }) {
  const canvasCache = new Map();
  async function enc(scale, q) {
    const w = Math.max(1, Math.round(W * scale));
    const h = Math.max(1, Math.round(H * scale));
    const key = `${w}x${h}`;
    let c = canvasCache.get(key);
    if (!c) {
      if (scale === 1 && src instanceof HTMLCanvasElement) {
        c = src; // already the exact picture
      } else {
        c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (flatten) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, 0, 0, w, h);
      }
      canvasCache.clear(); // keep only the latest canvas in memory
      canvasCache.set(key, c);
    }
    const blob = await new Promise((r) => c.toBlob(r, type, q));
    if (!blob || blob.type !== type) throw new Error('encode failed');
    return { blob, w, h, q, scale };
  }
  const fits = (r) => r.blob.size <= limit;

  let best = null;
  let smallest = null;
  let belowFloor = false;
  let lastScale = 1;
  const track = (r) => { if (!smallest || r.blob.size < smallest.blob.size) smallest = r; return r; };

  if (type !== 'image/png') {
    const hi = track(await enc(1, MAX_Q));
    if (fits(hi)) {
      best = hi;
    } else {
      const lo = track(await enc(1, floorQ));
      if (fits(lo)) {
        best = lo;
        let a = floorQ;
        let b = MAX_Q;
        for (let i = 0; i < 6; i++) {
          const m = (a + b) / 2;
          const x = track(await enc(1, m));
          if (fits(x)) { best = x; a = m; } else { b = m; }
        }
      } else if (allowScale) {
        let s = 1;
        let cur = lo;
        for (let i = 0; i < 10 && !best; i++) {
          s *= Math.max(0.5, Math.min(0.95, Math.sqrt(limit / cur.blob.size) * 0.97));
          if (Math.max(W, H) * s < MIN_SIDE) break;
          lastScale = s;
          cur = track(await enc(s, floorQ));
          if (fits(cur)) best = cur;
        }
        if (best) { // spend the spare budget on quality again
          let a = floorQ;
          let b = MAX_Q;
          for (let i = 0; i < 4; i++) {
            const m = (a + b) / 2;
            const x = track(await enc(best.scale, m));
            if (fits(x)) { best = x; a = m; } else { b = m; }
          }
        }
      }
      if (!best) { // last resort: below the quality floor
        let a = 0.3;
        let b = floorQ;
        for (let i = 0; i < 6; i++) {
          const m = (a + b) / 2;
          const x = track(await enc(lastScale, m));
          if (fits(x)) { best = x; a = m; belowFloor = true; } else { b = m; }
        }
      }
    }
  } else {
    // PNG is lossless: the only lever is the pixel size.
    let cur = track(await enc(1));
    if (fits(cur)) best = cur;
    else if (allowScale) {
      let s = 1;
      for (let i = 0; i < 10 && !best; i++) {
        s *= Math.max(0.5, Math.min(0.95, Math.sqrt(limit / cur.blob.size) * 0.97));
        if (Math.max(W, H) * s < MIN_SIDE) break;
        cur = track(await enc(s));
        if (fits(cur)) best = cur;
      }
    }
  }
  return { best, smallest, belowFloor };
}

/**
 * @param {File} file
 * @param {{limit:number, fmt?:'auto'|'jpeg'|'webp'|'png', floorQ?:number, allowScale?:boolean,
 *          target?:{w:number,h:number,fit?:'pad'|'cover',bg?:string,upscale?:boolean,trim?:boolean,fill?:number,min?:number}}} opts
 * @returns result object: status = skipped | done | warn | fail | unsupported | error
 */
export async function compressImage(file, opts) {
  const { limit, fmt = 'auto', floorQ = 0.85, target = null } = opts;
  const allowScale = target ? false : (opts.allowScale ?? true);
  const res = { name: file.name, origSize: file.size, notes: [] };

  if (!SUPPORTED.test(file.type)) return { ...res, status: 'unsupported' };

  let bitmap;
  try {
    bitmap = await createImageBitmap(file); // applies EXIF orientation
  } catch {
    return { ...res, status: 'error' };
  }
  const W = bitmap.width;
  const H = bitmap.height;
  res.w0 = W;
  res.h0 = H;

  const alreadyOk = target
    ? (W === target.w && H === target.h && file.size <= limit && !target.trim)
    : file.size <= limit;
  if (alreadyOk) {
    const thumb = makeThumb(bitmap, W, H);
    bitmap.close?.();
    return { ...res, status: 'skipped', blob: file, type: file.type, w: W, h: H, size: file.size, thumb };
  }

  const alpha = (file.type === 'image/png' || file.type === 'image/webp') ? await hasTransparency(bitmap) : false;
  let type;
  if (fmt === 'jpeg') type = 'image/jpeg';
  else if (fmt === 'webp') type = 'image/webp';
  else if (fmt === 'png') type = 'image/png';
  else if (target) type = 'image/jpeg'; // marketplaces want an opaque picture
  else type = alpha ? 'image/webp' : 'image/jpeg';

  let src = bitmap;
  let SW = W;
  let SH = H;
  let flatten = type === 'image/jpeg' && alpha;
  if (target) {
    try {
      const r = renderTarget(bitmap, { fit: 'pad', bg: '#ffffff', upscale: true, trim: false, fill: 0.85, ...target });
      src = r.canvas;
      SW = target.w;
      SH = target.h;
      flatten = false; // the canvas is already filled with the background colour
      res.notes.push(...r.notes);
      res.srcLong = r.srcLong;
      res.scale = r.scale;
      if (alpha) res.notes.push('flatten');
    } catch {
      bitmap.close?.();
      return { ...res, status: 'error' };
    }
  } else if (flatten) res.notes.push('flatten');

  let out;
  let belowFloor = false;
  let best;
  try {
    const r = await search({ src, W: SW, H: SH, type, flatten, limit, floorQ, allowScale });
    best = r.best;
    belowFloor = r.belowFloor;
    out = r.best || r.smallest;
  } catch {
    bitmap.close?.();
    return { ...res, status: 'error' };
  }
  const thumb = makeThumb(src, SW, SH);
  bitmap.close?.();

  if (belowFloor) res.notes.push('belowFloor');
  if (!target && out.scale < 1) res.notes.push('scaled');
  return {
    ...res,
    status: !best ? 'fail' : belowFloor ? 'warn' : 'done',
    blob: out.blob, type, w: out.w, h: out.h, q: type === 'image/png' ? null : out.q, size: out.blob.size,
    scale: target ? res.scale : out.scale, thumb,
  };
}
