// Quote-request and waitlist forms → POST /api/lead
import { cfg, track } from './track.js';

const MSG = {
  en: { thanks: 'Thanks! We have your request.', error: 'Something went wrong. Please try again.', required: 'Please fill in the required fields and accept the consent.' },
  zh: { thanks: '谢谢！我们已收到你的请求。', error: '出错了，请重试。', required: '请填写必填项并勾选同意。' },
};
const m = MSG[cfg.lang] || MSG.en;

if (document.querySelector('.cf-turnstile') && cfg.turnstileSiteKey) {
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  s.async = true; s.defer = true;
  document.head.appendChild(s);
}

// the partner boxes link here with ?src=<tool-slug>; keep that so we know which tool produced the lead
let srcParam = '';
try { srcParam = (new URLSearchParams(location.search).get('src') || '').replace(/[^\w-]/g, '').slice(0, 60); } catch { /* ignore */ }

document.querySelectorAll('[data-lead-form]').forEach((form) => {
  const msg = form.querySelector('.form-msg');
  if (srcParam && !form.dataset.src) { form.dataset.src = srcParam; const h = form.querySelector('[name=src]'); if (h) h.value = srcParam; }
  let viewed = false;
  const view = () => { if (!viewed) { viewed = true; track('lead_form_start', { cat: form.dataset.category }); } };
  form.addEventListener('focusin', view);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    body.consent = form.querySelector('[name=consent]').checked;
    const ts = form.querySelector('[name="cf-turnstile-response"]');
    if (ts) body.turnstile = ts.value;
    if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email) || !body.name || !body.consent) { msg.textContent = m.required; msg.className = 'form-msg err'; return; }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      msg.textContent = m.thanks; msg.className = 'form-msg ok';
      track('lead_submit', { cat: form.dataset.category, src: form.dataset.src || '' });
      form.reset();
      btn.disabled = false;
    } catch {
      msg.textContent = m.error; msg.className = 'form-msg err';
      btn.disabled = false;
    }
  });
});
