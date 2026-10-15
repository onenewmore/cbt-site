// Account page: magic-link sign-in, plan info, API key, policy-alert watchlist.
import { cfg, track } from './track.js';
import { api, setSession, clearSession, getSession, me } from './pro.js';

const root = document.getElementById('acct');
const L = JSON.parse(root.dataset.labels);
const signin = document.getElementById('acct-signin');
const main = document.getElementById('acct-main');
const params = new URLSearchParams(location.search);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function exchangeToken() {
  const t = params.get('t');
  if (!t) return;
  history.replaceState(null, '', location.pathname);
  const r = await api('/api/pro/session', { method: 'POST', body: { token: t }, auth: false });
  if (r.ok && r.data && r.data.session) { setSession(r.data.session); track('signin_ok'); } else {
    const m = signin.querySelector('.form-msg'); m.textContent = L.invalidLink; m.className = 'form-msg err';
  }
}

async function render() {
  const m = await me(true);
  if (!m.signedIn) { signin.hidden = false; main.hidden = true; return false; }
  signin.hidden = true; main.hidden = false;
  const pro = m.plan === 'pro';
  const navBtn = document.getElementById('nav-account');   // the header was drawn before the sign-in token was exchanged
  if (navBtn) { navBtn.textContent = navBtn.dataset.account; navBtn.classList.toggle('pro', pro); }
  document.body.classList.toggle('is-pro', pro);
  const end = m.periodEnd ? new Date(m.periodEnd).toISOString().slice(0, 10) : '';
  main.innerHTML = `
    <div class="acct-card"><p>${esc(L.signedAs)} <b>${esc(m.email)}</b> · <button class="btn" id="signout" type="button">${esc(L.signout)}</button></p>
      <p>${esc(L.plan)}: <b>${pro ? 'Pro' : esc(L.free)}</b>${pro ? ` · ${esc(L.status)}: ${esc(m.status)}${end ? ` · ${esc(L.renews)}: ${esc(end)}` : ''}` : ''}</p>
      ${pro ? `<p><button class="btn" id="portal" type="button">${esc(L.manage)}</button></p>` : `<p><a class="btn primary" href="${cfg.lang === 'zh' ? '/zh' : ''}/pricing/">Pro</a></p>`}
    </div>
    ${pro ? `
    <div class="acct-card stack"><h2>${esc(L.apiH)}</h2><p class="muted">${esc(L.apiLead)}</p>
      <p><button class="btn" id="rotate" type="button">${esc(L.rotate)}</button> <code id="key-out"></code></p><p class="small muted" id="key-note"></p></div>
    <div class="acct-card stack"><h2>${esc(L.watchH)}</h2><p class="muted">${esc(L.watchLead)}</p>
      <ul id="watch-list"></ul>
      <p><input id="watch-in" type="text" placeholder="${esc(L.watchPh)}" maxlength="14" style="max-width:260px"> <button class="btn" id="watch-add" type="button">${esc(L.watchAdd)}</button></p>
      <label><input type="checkbox" id="watch-digest"> ${esc(L.watchDigest)}</label>
      <p><span class="form-msg" id="watch-msg"></span></p></div>` : ''}`;
  document.getElementById('signout').addEventListener('click', () => { clearSession(); location.reload(); });
  if (pro) wirePro();
  return pro;
}

function wirePro() {
  document.getElementById('portal').addEventListener('click', async () => {
    const r = await api('/api/pro/portal', { method: 'POST' });
    if (r.ok && r.data && r.data.url) window.open(r.data.url, '_blank', 'noopener');
  });
  document.getElementById('rotate').addEventListener('click', async () => {
    const r = await api('/api/pro/apikey', { method: 'POST' });
    if (r.ok) { document.getElementById('key-out').textContent = r.data.apiKey; document.getElementById('key-note').textContent = L.keyOnce; track('apikey_rotate'); }
  });
  let watch = { codes: [], digest: true };
  const list = document.getElementById('watch-list');
  const draw = () => {
    list.innerHTML = watch.codes.map((c, i) => `<li><code>${esc(c)}</code> <button class="btn" data-rm="${i}" type="button" style="padding:1px 8px">×</button></li>`).join('');
    document.getElementById('watch-digest').checked = !!watch.digest;
  };
  const save = async () => {
    const r = await api('/api/pro/watch', { method: 'PUT', body: watch });
    const msg = document.getElementById('watch-msg');
    msg.textContent = r.ok ? L.watchSave : 'Error'; msg.className = 'form-msg ' + (r.ok ? 'ok' : 'err');
    if (r.ok && r.data) { watch = r.data; draw(); }
  };
  api('/api/pro/watch').then((r) => { if (r.ok) { watch = r.data; draw(); } });
  document.getElementById('watch-add').addEventListener('click', () => {
    const v = document.getElementById('watch-in').value.replace(/[^\d.]/g, '');
    if (v.replace(/\./g, '').length >= 6) { watch.codes = [...new Set([...watch.codes, v])]; document.getElementById('watch-in').value = ''; save(); }
  });
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { watch.codes.splice(Number(b.dataset.rm), 1); save(); } });
  document.getElementById('watch-digest').addEventListener('change', (e) => { watch.digest = e.target.checked; save(); });
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const msg = e.target.querySelector('.form-msg');
  const r = await api('/api/pro/login', { method: 'POST', body: { email, lang: cfg.lang }, auth: false });
  msg.textContent = r.ok || r.status === 200 ? L.sent : 'Error';
  msg.className = 'form-msg ' + (r.ok ? 'ok' : 'err');
  track('login_request');
});

(async () => {
  await exchangeToken();
  const pro = await render();
  if (params.get('checkout') === 'success' && !pro) {
    const note = document.createElement('p'); note.className = 'notice'; note.textContent = L.checkoutOk;
    root.prepend(note);
    track('checkout_return');
    // the Paddle webhook can arrive a few seconds after the redirect
    for (let i = 0; i < 12 && getSession(); i++) { await new Promise((r) => setTimeout(r, 4000)); if (await render()) break; }
  }
})();
