// Daily job (cron trigger). Two Pro features:
//   1. HTS watchlist: re-read each watched code from the official USITC HTS API, compare with the last snapshot, email the diff.
//   2. Policy digest: email new entries from data/policy-updates.json (baked in at build time) that the user has not seen yet.
// Subrequest budget: Workers cap subrequests per invocation (50 on the free plan, 1000 paid). CRON_MAX_CODES bounds HTS lookups per run;
// codes are processed oldest-snapshot-first, so a long watchlist rotates across days instead of starving.
import { now, sleep, escHtml } from './util.mjs';
import { sendMail, layoutEmail } from './mail.mjs';
import { hasPro } from './entitlement.mjs';
import { prefsKey } from './pro.mjs';
import { htsSearch } from './fetchers.mjs';
import { pickHtsItem, formatHts, extract99Refs } from './generated/js/calc.js';
import policy from './generated/policy-updates.mjs';

const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

export async function fingerprint(env, code) {
  const digits = String(code).replace(/\D/g, '');
  const kw = digits.length >= 8 ? formatHts(digits.slice(0, 8)) : formatHts(digits);
  const results = await htsSearch(env, kw);
  const picked = pickHtsItem(results, digits);
  if (picked.item) {
    const refs = [...new Set([picked.item, ...picked.ancestors].flatMap(extract99Refs))].sort();
    const i = picked.item;
    return { kind: 'line', htsno: i.htsno, description: stripTags(i.description).slice(0, 160), general: (i.general || '').trim(), special: (i.special || '').trim(), other: (i.other || '').trim(), chapter99: refs };
  }
  if (picked.list.length) return { kind: 'list', lines: picked.list.slice(0, 60).map((r) => `${r.htsno} | ${(r.general || '').trim()}`).sort() };
  return { kind: 'missing' };
}

export function diffFingerprints(a, b) {
  const out = [];
  if (a.kind !== b.kind) { out.push(`structure: ${a.kind} → ${b.kind}`); return out; }
  if (a.kind === 'line') {
    for (const k of ['general', 'special', 'other']) if (a[k] !== b[k]) out.push(`${k}: "${a[k] || '—'}" → "${b[k] || '—'}"`);
    const add = b.chapter99.filter((x) => !a.chapter99.includes(x)); const del = a.chapter99.filter((x) => !b.chapter99.includes(x));
    if (add.length) out.push('Chapter 99 added: ' + add.join(', '));
    if (del.length) out.push('Chapter 99 removed: ' + del.join(', '));
    if (a.description !== b.description) out.push('description changed');
  } else if (a.kind === 'list') {
    const add = b.lines.filter((x) => !a.lines.includes(x)); const del = a.lines.filter((x) => !b.lines.includes(x));
    for (const x of add) out.push('+ ' + x);
    for (const x of del) out.push('- ' + x);
  }
  return out;
}

async function listAll(env, prefix) {
  const keys = [];
  let cursor;
  do {
    const page = await env.CBT_KV.list({ prefix, cursor, limit: 1000 });
    keys.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return keys;
}

export async function runScheduled(env) {
  const report = { users: 0, codesChecked: 0, changed: 0, alertsSent: 0, digestsSent: 0, errors: 0 };
  const site = env.SITE_URL || '';
  const delay = env.CRON_DELAY_MS !== undefined ? Number(env.CRON_DELAY_MS) : 250;
  const maxCodes = Number(env.CRON_MAX_CODES) || 40;

  // active Pro users who have preferences
  const users = [];
  for (const k of await listAll(env, 'prefs:')) {
    const email = k.slice('prefs:'.length);
    if (!(await hasPro(env, email))) continue;
    const prefs = JSON.parse((await env.CBT_KV.get(k)) || 'null');
    if (prefs) users.push({ email, prefs });
  }
  report.users = users.length;

  // ---- 1. HTS watchlist ----
  const watchers = new Map();
  for (const u of users) for (const c of u.prefs.codes || []) { const d = c.replace(/\D/g, ''); if (!watchers.has(d)) watchers.set(d, new Set()); watchers.get(d).add(u.email); }
  const snaps = new Map();
  for (const d of watchers.keys()) { const raw = await env.CBT_KV.get(`snap:${d}`); snaps.set(d, raw ? JSON.parse(raw) : null); }
  const order = [...watchers.keys()].sort((a, b) => ((snaps.get(a) || {}).ts || 0) - ((snaps.get(b) || {}).ts || 0)).slice(0, maxCodes);
  const perUser = new Map();
  for (const d of order) {
    try {
      const fp = await fingerprint(env, d);
      report.codesChecked++;
      const prev = snaps.get(d);
      if (prev && JSON.stringify(prev.fp) !== JSON.stringify(fp)) {
        const diff = diffFingerprints(prev.fp, fp);
        if (diff.length) {
          report.changed++;
          for (const email of watchers.get(d)) { if (!perUser.has(email)) perUser.set(email, []); perUser.get(email).push({ code: formatHts(d), diff }); }
        }
      }
      await env.CBT_KV.put(`snap:${d}`, JSON.stringify({ fp, ts: now() }));
    } catch (e) { report.errors++; console.error('watch check failed', d, e && e.message); }
    if (delay) await sleep(delay);
  }
  for (const [email, changes] of perUser) {
    const lines = changes.map((c) => `${c.code}\n  ${c.diff.join('\n  ')}`).join('\n\n');
    const html = layoutEmail({
      lang: 'en', heading: 'Tariff line changed / 税则条目有变化',
      paragraphs: [
        'The official USITC HTS data changed for codes on your watchlist. / 你关注的税号在美国 USITC HTS 官方数据中有变化：',
        ...changes.map((c) => `<b>${escHtml(c.code)}</b><br>${c.diff.map(escHtml).join('<br>')}`),
        'Reference only; confirm with your customs broker. / 仅供参考，请与报关行确认。',
      ],
      button: { href: `${site}/account/`, label: 'Open account / 打开账户' },
    });
    const r = await sendMail(env, { to: email, subject: `HTS change on ${changes.length} watched code(s) / 关注税号有变化`, text: `${lines}\n\nManage: ${site}/account/`, html });
    if (r.ok) report.alertsSent++;
  }

  // ---- 2. policy digest ----
  for (const u of users) {
    const fresh = await env.CBT_KV.get(prefsKey(u.email));
    const prefs = fresh ? JSON.parse(fresh) : u.prefs;
    if (!prefs.digest) continue;
    const seen = new Set(prefs.seen || policy.updates.map((x) => x.id));
    const news = policy.updates.filter((x) => !seen.has(x.id)).sort((a, b) => a.date.localeCompare(b.date));
    if (!news.length) continue;
    const text = news.map((x) => `${x.date} · ${x.region}\n${x.title.en} / ${x.title.zh}\n${x.summary.en}\n${x.summary.zh}${x.source ? '\n' + x.source.url : ''}`).join('\n\n');
    const html = layoutEmail({
      lang: 'en', heading: 'Policy updates / 政策更新',
      paragraphs: news.map((x) => `<b>${escHtml(x.date)} · ${escHtml(x.region)}</b><br><b>${escHtml(x.title.en)}</b><br>${escHtml(x.summary.en)}<br><span style="color:#556">${escHtml(x.title.zh)}：${escHtml(x.summary.zh)}</span>${x.source ? `<br><a href="${escHtml(x.source.url)}">${escHtml(x.source.label)}</a>` : ''}`),
      button: { href: `${site}/policy-updates/`, label: 'All updates / 全部更新' },
      footer: `You get this because policy digest is on in your account. Turn it off at ${escHtml(site)}/account/. / 你收到此邮件是因为账户中开启了政策摘要，可在账户页关闭。`,
    });
    const r = await sendMail(env, { to: u.email, subject: `Policy update: ${news[news.length - 1].title.en} / 政策更新`, text: text + `\n\nTurn off: ${site}/account/`, html });
    if (r.ok) {
      prefs.seen = [...new Set([...(prefs.seen || []), ...news.map((x) => x.id)])].slice(-200);
      await env.CBT_KV.put(prefsKey(u.email), JSON.stringify(prefs));
      report.digestsSent++;
    }
  }
  return report;
}
