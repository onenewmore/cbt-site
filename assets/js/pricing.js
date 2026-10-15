// Pricing page: Paddle.js overlay checkout, or a waitlist when Paddle is not configured yet.
import { cfg, track } from './track.js';
import { me } from './pro.js';

const root = document.querySelector('[data-pricing]');
const btn = document.getElementById('buy');
const waitlist = document.getElementById('waitlist');
const ready = root && root.dataset.ready === '1';
let paddleReady = false;

function loadPaddle() {
  return new Promise((resolve, reject) => {
    if (window.Paddle) return resolve(window.Paddle);
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.onload = () => resolve(window.Paddle);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initPaddle() {
  const Paddle = await loadPaddle();
  if (cfg.paddle.env === 'sandbox') Paddle.Environment.set('sandbox');
  Paddle.Initialize({
    token: cfg.paddle.clientToken,
    eventCallback: (ev) => {
      if (ev.name === 'checkout.completed') track('checkout_complete', { plan: selected() });
      if (ev.name === 'checkout.closed') track('checkout_closed');
    },
  });
  paddleReady = true;
  return Paddle;
}

const selected = () => (document.querySelector('input[name=bill]:checked') || {}).value || 'monthly';

btn.addEventListener('click', async () => {
  const plan = selected();
  track('pro_cta', { where: 'pricing', plan, ready: ready ? '1' : '0' });
  if (!ready) { waitlist.hidden = false; waitlist.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  try {
    const Paddle = paddleReady ? window.Paddle : await initPaddle();
    const prefix = cfg.lang === 'zh' ? '/zh' : '';
    track('checkout_open', { plan });
    Paddle.Checkout.open({
      items: [{ priceId: cfg.paddle.prices[plan], quantity: 1 }],
      settings: { displayMode: 'overlay', theme: 'light', locale: cfg.lang === 'zh' ? 'zh-Hans' : 'en', successUrl: `${location.origin}${prefix}/account/?checkout=success` },
      customData: { source: 'web', lang: cfg.lang },
    });
  } catch (e) {
    console.error(e);
    btn.textContent = 'Checkout unavailable';
  }
});

me().then((m) => {
  if (m.plan === 'pro') { btn.textContent = btn.dataset.labelCurrent; btn.disabled = true; }
});
if (ready) initPaddle().catch(() => {});
