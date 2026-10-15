// Transactional email through Resend (https://resend.com). Without RESEND_API_KEY, messages are collected in env.__outbox (tests / local dev)
// so nothing is ever sent by accident.
import { escHtml, fetchWithTimeout } from './util.mjs';

export async function sendMail(env, { to, subject, text, html, replyTo }) {
  const msg = { from: env.MAIL_FROM || 'Cross-border Trade Toolkit <noreply@example.com>', to: Array.isArray(to) ? to : [to], subject, text, html: html || `<pre style="font:14px/1.5 system-ui">${escHtml(text)}</pre>` };
  if (replyTo) msg.reply_to = replyTo;
  if (!env.RESEND_API_KEY) {
    (env.__outbox ||= []).push(msg);
    if (env.DEV_LOG_MAIL) console.log('[mail:dev]', msg.to.join(','), '|', subject, '\n' + text);
    return { ok: true, dev: true };
  }
  try {
    const res = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST', timeout: 10_000,
      headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (!res.ok) { console.error('mail failed', res.status, (await res.text()).slice(0, 200)); return { ok: false, status: res.status }; }
    return { ok: true };
  } catch (e) { console.error('mail error', e && e.message); return { ok: false }; }
}

export function layoutEmail({ lang, heading, paragraphs, button, footer }) {
  const p = paragraphs.map((x) => `<p style="margin:0 0 12px">${x}</p>`).join('');
  const btn = button ? `<p style="margin:18px 0"><a href="${escHtml(button.href)}" style="background:#2f80ed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">${escHtml(button.label)}</a></p><p style="margin:0 0 12px;color:#667;font-size:12px">${escHtml(button.href)}</p>` : '';
  return `<!doctype html><html lang="${lang === 'zh' ? 'zh-Hans' : 'en'}"><body style="margin:0;padding:24px;background:#f5f7fa"><div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;padding:24px;font:15px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif;color:#1b2430"><h1 style="font-size:18px;margin:0 0 14px">${escHtml(heading)}</h1>${p}${btn}<p style="margin:18px 0 0;color:#778;font-size:12px">${footer || ''}</p></div></body></html>`;
}
