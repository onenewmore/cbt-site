// "Export CSV" for tool result tables (Pro). Scrapes the rendered result rows, so it works for any tool that renders .results / .fx-tbl.
import { cfg, track } from './track.js';
import { downloadCsv } from './csv.js';
import { paywall, state } from './gate.js';

const L = { en: { btn: 'Export CSV', pro: 'Pro' }, zh: { btn: '导出 CSV', pro: 'Pro' } };

function rowsFrom(node) {
  if (node.classList.contains('fx-tbl') || node.tagName === 'TABLE') {
    return [...node.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim())).filter((r) => r.some(Boolean));
  }
  return [...node.querySelectorAll('.res-row')].map((r) => [r.querySelector('.res-label')?.innerText.trim() || '', r.querySelector('.res-val')?.innerText.replace(/\s+/g, ' ').trim() || '']);
}

export function attachExport(root) {
  const l = L[cfg.lang] || L.en;
  const scan = () => {
    root.querySelectorAll('.results:not([data-exp]), .fx-tbl:not([data-exp])').forEach((node) => {
      node.dataset.exp = '1';
      const bar = document.createElement('div');
      bar.className = 'exp-bar';
      bar.innerHTML = `<button class="btn" type="button">${l.btn} <span class="tag-pro">${l.pro}</span></button>`;
      bar.querySelector('button').addEventListener('click', () => {
        track('export_click', { tool: cfg.tool, pro: state.pro ? '1' : '0' });
        if (!state.pro) { paywall('export'); return; }
        downloadCsv(rowsFrom(node), `${cfg.slug || 'result'}-${new Date().toISOString().slice(0, 10)}.csv`);
      });
      node.after(bar);
    });
  };
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  scan();
}
