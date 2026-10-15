// Runs on every page: analytics, return-visit measurement, outbound tracking, account button state.
import { cfg, track, trackVisit } from './track.js';
import { me } from './pro.js';

globalThis.CBT_PROXY = ''; // same-origin API proxy (/api/p/…)

// Where did this page view come from? An external host, 'internal' (navigation within the site) or 'direct'.
let ref = 'direct';
try {
  if (document.referrer) {
    const h = new URL(document.referrer).hostname.replace(/^www\./, '');
    ref = h === location.hostname.replace(/^www\./, '') ? 'internal' : h;
  }
} catch { /* ignore */ }
// Our own beacon records the referrer to tell organic search from social/direct; Plausible records page views by itself.
track('pageview', { ref }, { plausible: false });
trackVisit(ref);

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-track]');
  if (!a) return;
  const d = a.dataset;
  track(d.track, { where: d.where, cat: d.cat, src: d.src, partner: d.partner });
}, { capture: true });

me().then((m) => {
  const btn = document.getElementById('nav-account');
  if (btn && m.signedIn) { btn.textContent = btn.dataset.account; if (m.plan === 'pro') btn.classList.add('pro'); }
  if (m.plan === 'pro') { document.body.classList.add('is-pro'); document.querySelectorAll('[data-pro-strip]').forEach((el) => { el.hidden = true; }); }
});
