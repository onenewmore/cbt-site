// Tiny CSV helpers (RFC4180-ish): auto-detects , ; or tab; handles quotes.
export function parseCsv(text) {
  const t = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
  if (!t) return [];
  const first = t.split('\n', 1)[0];
  const delim = [['\t', (first.match(/\t/g) || []).length], [';', (first.match(/;/g) || []).length], [',', (first.match(/,/g) || []).length]].sort((a, b) => b[1] - a[1])[0];
  const d = delim[1] ? delim[0] : ',';
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === d) { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c;
  }
  row.push(cur);
  rows.push(row);
  return rows.filter((r) => r.some((c) => String(c).trim() !== '')).map((r) => r.map((c) => c.trim()));
}

// Guard against CSV/formula injection when the file is opened in a spreadsheet.
const safe = (v) => { const s = String(v ?? ''); return /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? "'" + s : s; };

export function toCsv(rows) {
  return rows.map((r) => r.map((c) => { const s = safe(c); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
}

export function downloadCsv(rows, name) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
