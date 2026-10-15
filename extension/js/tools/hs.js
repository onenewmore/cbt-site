import { t, registerMessages, getLang } from '../i18n.js';
import { esc, bindCopy, debounce } from '../dom.js';
import { HS_CHAPTERS, HS_COMMON } from '../data/hsdata.js';
import { searchHsCommon, searchHsChapters, hsQueryTerms, formatHs6, formatHts } from '../calc.js';
import { htsSearch, stripTags } from '../hts.js';
import { gotoTool, takePending } from '../bus.js';
import { get, set } from '../store.js';

registerMessages({
  zh: {
    'nav.hs': 'HS 编码查询',
    'hs.title': 'HS 编码查询',
    'hs.ph': '输入品名（中/英文）或编码，如 蓝牙耳机、yoga mat、8518',
    'hs.go': '查询',
    'hs.notice': 'HS 编码前 6 位全球通用，各国在此基础上自行细分到 8–10 位（美国 HTS 10 位、欧盟 CN 8 位 / TARIC 10 位、中国 10 位）。材质、用途、成分、加工程度都会影响归类，结果仅供参考，请以海关最终认定为准。',
    'hs.try': '试试',
    'hs.common': '常见品类参考（内置，离线可用）',
    'hs.live': '美国 HTS 在线检索（USITC 官方接口）',
    'hs.liveHint': '来自美国税则的 8/10 位税号，前 6 位即国际 HS；“General”为基础税率。',
    'hs.copyRaw': '复制 6 位',
    'hs.detail': '展开美国税则明细',
    'hs.hideDetail': '收起明细',
    'hs.us': '美国关税',
    'hs.eu': '欧盟 TARIC',
    'hs.noCommon': '内置品类库没有匹配项。可尝试换个叫法、用英文关键词，或直接输入 4–10 位编码；也可以在下方“章目录”里按大类查找。',
    'hs.liveNone': '美国税则里没有匹配的条目，请换个关键词或输入编码。',
    'hs.chapters': 'HS 章目录（共 97 章，点击查看）',
    'hs.chap': '第 {n} 章',
    'hs.headings': '该章内常见品目（点击进入）',
    'hs.inChapter': '该章常见商品',
    'hs.moreDigits': '输入 4 位以上编码可查看具体子目与税率，例如 {ex}。',
    'hs.noCode': '没有找到该编码，请检查位数。',
    'hs.loading': '检索中…',
    'hs.note': '提示：美国 HTS 在线检索针对的是美国税则描述，关键词请尽量使用英文；中文品名仅在内置品类库中匹配。',
    'hs.general': '基础税率',
  },
  en: {
    'nav.hs': 'HS Code Lookup',
    'hs.title': 'HS Code Lookup',
    'hs.ph': 'Enter a product name (EN/ZH) or a code, e.g. yoga mat, 蓝牙耳机, 8518',
    'hs.go': 'Search',
    'hs.notice': 'The first 6 digits of an HS code are shared worldwide; each country extends them to 8–10 digits (US HTS 10, EU CN 8 / TARIC 10, China 10). Material, use, composition and processing all affect classification. Reference only — customs has the final say.',
    'hs.try': 'Try',
    'hs.common': 'Common product reference (built in, works offline)',
    'hs.live': 'US HTS live search (official USITC API)',
    'hs.liveHint': 'US 8/10-digit tariff lines; the first 6 digits are the international HS. “General” is the base duty rate.',
    'hs.copyRaw': 'Copy 6 digits',
    'hs.detail': 'Show US tariff lines',
    'hs.hideDetail': 'Hide lines',
    'hs.us': 'US tariff',
    'hs.eu': 'EU TARIC',
    'hs.noCommon': 'No match in the built-in list. Try another wording or English keywords, enter a 4–10 digit code, or browse the chapter list below.',
    'hs.liveNone': 'No matching lines in the US tariff schedule. Try another keyword or a code.',
    'hs.chapters': 'HS chapters (97 — click to browse)',
    'hs.chap': 'Chapter {n}',
    'hs.headings': 'Common headings in this chapter (click)',
    'hs.inChapter': 'Common goods in this chapter',
    'hs.moreDigits': 'Enter 4+ digits to see subheadings and duty rates, e.g. {ex}.',
    'hs.noCode': 'Code not found. Check the number of digits.',
    'hs.loading': 'Searching…',
    'hs.note': 'Tip: the live US search matches US tariff wording, so use English keywords; Chinese names are matched against the built-in list only.',
    'hs.general': 'General rate',
  },
});

const norm = (s) => String(s || '').replace(/\D/g, '');

export default {
  id: 'hs',
  titleKey: 'nav.hs',
  async mount(el) {
    const lang = getLang();
    const saved = await get('hsState', { q: '' });
    const examples = lang === 'zh' ? ['蓝牙耳机', '手机壳', '连衣裙', 'LED灯带', '瑜伽垫', '8518'] : ['yoga mat', 'phone case', 'led strip', 'smartwatch', 'backpack', '8518'];

    el.innerHTML = `
      <h2 class="panel-title">${esc(t('hs.title'))}</h2>
      <div class="pad">
        <div class="notice">${esc(t('hs.notice'))}</div>
        <div class="inline-form hs-form">
          <input id="hs-q" type="text" placeholder="${esc(t('hs.ph'))}" autocomplete="off">
          <button class="btn primary" id="hs-go" type="button">${esc(t('hs.go'))}</button>
        </div>
        <div class="hs-try muted small">${esc(t('hs.try'))}: ${examples.map((x) => `<a href="#" class="chip" data-q="${esc(x)}">${esc(x)}</a>`).join('')}</div>
        <div id="hs-out"></div>
        <details class="hs-chapters">
          <summary>${esc(t('hs.chapters'))}</summary>
          <table class="tbl"><tbody>${HS_CHAPTERS.filter((c) => c[0] !== '77').map((c) => `
            <tr class="hs-chap" data-q="${c[0]}"><td class="mono">${c[0]}</td><td>${esc(lang === 'zh' ? c[1] : c[2])}</td></tr>`).join('')}</tbody></table>
        </details>
        <div class="muted small foot">${esc(t('hs.note'))}</div>
      </div>`;
    bindCopy(el);

    const $ = (id) => el.querySelector('#' + id);
    const out = $('hs-out');
    let seq = 0;

    const name = (e) => (lang === 'zh' ? e[1] : e[2]);
    const subName = (e) => (lang === 'zh' ? e[2] : e[1]);
    const noteOf = (e) => {
      if (!e[4]) return '';
      const [z, en] = e[4].split('||');
      return lang === 'zh' ? z : (en || z);
    };

    function card(e) {
      const code = formatHs6(e[0]);
      const n = noteOf(e);
      return `<div class="hs-card" data-hs="${e[0]}">
        <div class="hs-card-top">
          <button class="hs-code big" type="button" data-copy="${code}" title="${esc(t('common.copyHint'))}">${code}</button>
          <div class="hs-name"><b>${esc(name(e))}</b><div class="muted small">${esc(subName(e))}</div></div>
        </div>
        ${n ? `<div class="hs-note">${esc(n)}</div>` : ''}
        <div class="hs-card-act">
          <button class="btn small" type="button" data-copy="${e[0]}">${esc(t('hs.copyRaw'))}</button>
          <button class="btn small" type="button" data-expand="${e[0]}">${esc(t('hs.detail'))}</button>
          <button class="btn small" type="button" data-us="${e[0]}">${esc(t('hs.us'))}</button>
          <button class="btn small" type="button" data-eu="${e[0]}">${esc(t('hs.eu'))}</button>
        </div>
        <div class="hs-detail" hidden></div>
      </div>`;
    }

    function liveRow(it, ind = 0) {
      const code = it.htsno;
      const d = norm(code);
      return `<div class="hs-row" style="--ind:${ind}">
        <button class="hs-code" type="button" data-copy="${esc(code)}" title="${esc(t('common.copyHint'))}">${esc(code)}</button>
        <span class="hs-desc">${esc(stripTags(it.description))}</span>
        <span class="hs-rate" title="${esc(t('hs.general'))}">${esc(it.general || '')}</span>
        <span class="hs-act">${d.length >= 6 ? `<button class="btn small" type="button" data-us="${d}">${esc(t('hs.us'))}</button>` : ''}</span>
      </div>`;
    }

    // hierarchical list under a code prefix, e.g. every line of 8518.30
    function prefixRows(list, digits) {
      const rows = list.filter((it) => {
        const d = norm(it.htsno);
        return d && d.length >= 4 && (d.startsWith(digits) || digits.startsWith(d)) && !/^9[89]/.test(d);
      });
      const min = Math.min(...rows.map((r) => Number(r.indent) || 0));
      return rows.map((r) => liveRow(r, Math.max(0, (Number(r.indent) || 0) - min)));
    }

    function section(title, bodyHtml, hint = '') {
      return `<h3 class="section-title small">${esc(title)}</h3>${hint ? `<div class="muted small hs-hint">${esc(hint)}</div>` : ''}${bodyHtml}`;
    }

    function chapterBlock(ch) {
      const items = HS_COMMON.filter((e) => e[0].startsWith(ch[0]));
      const heads = [...new Set(items.map((e) => e[0].slice(0, 4)))];
      return `<div class="hs-chapter-card"><b>${esc(t('hs.chap', { n: ch[0] }))}</b> ${esc(lang === 'zh' ? ch[1] : ch[2])}
        <div class="muted small">${esc(lang === 'zh' ? ch[2] : ch[1])}</div>
        ${heads.length ? `<div class="hs-heads muted small">${esc(t('hs.headings'))}: ${heads.map((h) => `<a href="#" class="chip" data-q="${h}">${h}</a>`).join('')}</div>` : ''}</div>`;
    }

    async function runCode(d, my) {
      const chapter = HS_CHAPTERS.find((c) => c[0] === d.slice(0, 2));
      if (d.length < 4) {
        let html = chapter ? chapterBlock(chapter) : `<div class="warn">${esc(t('hs.noCode'))}</div>`;
        const items = HS_COMMON.filter((e) => e[0].startsWith(d.slice(0, 2)));
        if (items.length) html += section(t('hs.inChapter'), items.map(card).join(''));
        html += `<div class="muted small">${esc(t('hs.moreDigits', { ex: '8518 / 8518.30' }))}</div>`;
        out.innerHTML = html;
        return;
      }
      const items = HS_COMMON.filter((e) => e[0].startsWith(d.slice(0, 6)));
      let html = items.length ? section(t('hs.common'), items.map(card).join('')) : '';
      html += `<div id="hs-live">${section(t('hs.live'), `<div class="muted">${esc(t('hs.loading'))}</div>`, t('hs.liveHint'))}</div>`;
      out.innerHTML = html;
      try {
        const list = await htsSearch(formatHts(d.slice(0, 10)));
        if (my !== seq) return;
        const rows = prefixRows(list, d);
        $('hs-live').innerHTML = section(t('hs.live'), rows.length ? `<div class="hs-list">${rows.join('')}</div>` : `<div class="warn">${esc(t('hs.noCode'))}</div>`, t('hs.liveHint'));
      } catch {
        if (my !== seq) return;
        $('hs-live').innerHTML = section(t('hs.live'), `<div class="warn">${esc(t('common.netError'))}</div>`);
      }
    }

    async function liveKeyword(latin) {
      const kws = [...new Set(latin)].sort((a, b) => b.length - a.length).slice(0, 2);
      const lists = await Promise.all(kws.map((k) => htsSearch(k).catch(() => null)));
      if (lists.every((l) => l === null)) throw new Error('net');
      const seen = new Set();
      const hits = [];
      for (const list of lists) {
        for (const it of list || []) {
          const d = norm(it.htsno);
          if (d.length < 6 || /^9[89]/.test(d)) continue;
          const desc = stripTags(it.description).toLowerCase();
          const matched = latin.filter((w) => desc.includes(w)).length;
          if (!matched) continue;
          const key = it.htsno + '|' + desc;
          if (seen.has(key)) continue;
          seen.add(key);
          hits.push({ it, matched, d });
        }
      }
      const best = Math.max(0, ...hits.map((h) => h.matched));
      return hits.filter((h) => h.matched === best).sort((a, b) => a.d.localeCompare(b.d)).slice(0, 40).map((h) => h.it);
    }

    async function runText(raw, my) {
      const found = searchHsCommon(raw, HS_COMMON, 30);
      const chapters = searchHsChapters(raw, HS_CHAPTERS);
      const { latin } = hsQueryTerms(raw);
      let html = '';
      if (chapters.length) html += chapters.map(chapterBlock).join('');
      if (found.length) html += section(t('hs.common'), found.map(card).join(''));
      else if (!latin.length && !chapters.length) html += `<div class="warn">${esc(t('hs.noCommon'))}</div>`;
      if (latin.length) html += `<div id="hs-live">${section(t('hs.live'), `<div class="muted">${esc(t('hs.loading'))}</div>`, t('hs.liveHint'))}</div>`;
      out.innerHTML = html;
      if (!latin.length) return;
      try {
        const rows = await liveKeyword(latin);
        if (my !== seq) return;
        $('hs-live').innerHTML = section(t('hs.live'), rows.length ? `<div class="hs-list">${rows.map((r) => liveRow(r)).join('')}</div>` : `<div class="muted">${esc(t('hs.liveNone'))}</div>`, t('hs.liveHint'));
      } catch {
        if (my !== seq) return;
        $('hs-live').innerHTML = section(t('hs.live'), `<div class="warn">${esc(t('common.netError'))}</div>`);
      }
    }

    async function run(q) {
      const raw = String(q ?? $('hs-q').value).trim();
      set('hsState', { q: raw });
      const my = ++seq;
      if (!raw) { out.innerHTML = ''; return; }
      const digits = raw.replace(/[\s.\-]/g, '');
      if (/^\d{2,10}$/.test(digits)) await runCode(digits, my);
      else await runText(raw, my);
    }

    async function toggleDetail(btn) {
      const cardEl = btn.closest('.hs-card');
      const box = cardEl.querySelector('.hs-detail');
      if (!box.hidden) { box.hidden = true; btn.textContent = t('hs.detail'); return; }
      box.hidden = false;
      btn.textContent = t('hs.hideDetail');
      if (box.dataset.loaded) return;
      const hs6 = btn.dataset.expand;
      box.innerHTML = `<div class="muted">${esc(t('hs.loading'))}</div>`;
      try {
        const list = await htsSearch(formatHts(hs6));
        const rows = prefixRows(list, hs6).filter((r) => r);
        box.innerHTML = rows.length ? `<div class="hs-list">${rows.join('')}</div>` : `<div class="warn">${esc(t('hs.noCode'))}</div>`;
        box.dataset.loaded = '1';
      } catch {
        box.innerHTML = `<div class="warn">${esc(t('common.netError'))}</div>`;
      }
    }

    el.addEventListener('click', (e) => {
      const q = e.target.closest('[data-q]');
      if (q) {
        e.preventDefault();
        $('hs-q').value = q.dataset.q;
        const det = el.querySelector('.hs-chapters');
        if (det) det.open = false;
        run(q.dataset.q);
        el.closest('.content')?.scrollTo?.(0, 0);
        return;
      }
      const ex = e.target.closest('[data-expand]');
      if (ex) { toggleDetail(ex); return; }
      const us = e.target.closest('[data-us]');
      if (us) { gotoTool('ustariff', { hs: us.dataset.us.slice(0, 10) }); return; }
      const eu = e.target.closest('[data-eu]');
      if (eu) gotoTool('eutariff', { hs: eu.dataset.eu });
    });
    $('hs-go').addEventListener('click', () => run());
    $('hs-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    $('hs-q').addEventListener('input', debounce(() => { if ($('hs-q').value.trim().length >= 2) run(); }, 450));

    const pend = takePending('hs');
    const first = (pend && pend.q) || saved.q || '';
    $('hs-q').value = first;
    if (first) run(first);
    $('hs-q').focus();
  },
};
