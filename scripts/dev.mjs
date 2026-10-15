// Local dev / test server: serves dist/ like Cloudflare static assets and runs the real Worker code in front of it.
//   node scripts/dev.mjs [--port 8787] [--live]
// By default third-party data providers and Paddle's customer API are mocked (offline, deterministic). --live lets them through.
// Dev-only helpers live under /__dev/* and exist only in this script, never in the Worker:
//   GET  /__dev/outbox                      captured emails (no real mail is sent without RESEND_API_KEY)
//   POST /__dev/subscribe {email,status}    simulates a signed Paddle subscription webhook for that email
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/src/index.mjs';
import { MemoryKV } from './memory-kv.mjs';
import { hmacHex } from '../worker/src/util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const port = Number((args[args.indexOf('--port') + 1]) || process.env.PORT || 8787);
const live = args.includes('--live');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

const events = [];
const env = {
  CBT_KV: new MemoryKV(), SESSION_SECRET: 'dev-session-secret', PADDLE_WEBHOOK_SECRET: 'dev-webhook-secret', PADDLE_API_KEY: 'dev', PADDLE_ENV: 'sandbox',
  SITE_URL: `http://localhost:${port}`, MAIL_FROM: 'Dev <dev@localhost>', ADMIN_TOKEN: 'dev-admin', DEV_LOG_MAIL: process.env.DEV_LOG_MAIL || '',
  EVENTS: { writeDataPoint: (d) => { events.push(d); if (events.length > 500) events.shift(); } }, __outbox: [],
  ASSETS: { fetch: serveStatic },
};

// ---------- static assets (clean URLs + 404.html) ----------
async function serveStatic(req) {
  const u = new URL(req.url);
  let p = decodeURIComponent(u.pathname);
  if (p.includes('..')) return new Response('bad', { status: 400 });
  let file = path.join(DIST, p);
  if (p.endsWith('/')) file = path.join(file, 'index.html');
  else if (!path.extname(p) && fs.existsSync(path.join(file, 'index.html'))) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return new Response(fs.readFileSync(file), { headers: { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' } });
  }
  const nf = path.join(DIST, '404.html');
  return new Response(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// ---------- mocked upstreams ----------
const devCustomers = new Map();
const realFetch = globalThis.fetch;
const HTS = {
  '8517.13.00': [
    { htsno: '8517', description: 'Telephone sets, including smartphones', general: '' },
    { htsno: '8517.13.00', description: 'Smartphones', general: '' },
    { htsno: '8517.13.00.00', description: 'Smartphones', general: 'Free', special: '', other: '35%', footnotes: [{ columns: ['general'], value: 'See 9903.88.01.' }] },
  ],
  '6109.10.00': [
    { htsno: '6109', description: 'T-shirts, singlets, tank tops', general: '' },
    { htsno: '6109.10.00', description: 'Of cotton', general: '16.5%', special: 'Free (A+,AU,B,BH,CA,CL,CO,D,E,IL,JO,KR,MA,MX,OM,P,PA,PE,S,SG)', other: '90%', footnotes: [] },
  ],
  '9903.88.01': [{ htsno: '9903.88.01', description: 'Articles the product of China, List 1', general: 'The duty provided in the applicable subheading + 25%' }],
};
const ER = { result: 'success', time_last_update_unix: Math.floor(Date.now() / 1000), rates: { USD: 1, CNY: 7.12, EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, AUD: 1.52, CHF: 0.88, HKD: 7.8, SGD: 1.34, KRW: 1350, INR: 83.2, MXN: 17.1, BRL: 5.0, TRY: 33, VND: 25000, THB: 35.5, MYR: 4.7, PHP: 56, IDR: 15800, AED: 3.67, SAR: 3.75, PLN: 4.0, SEK: 10.5, NOK: 10.7, DKK: 6.9 } };
function mockFetch(input, init) {
  const u = new URL(String(input && input.url ? input.url : input));
  const j = (data, status = 200) => Promise.resolve(Response.json(data, { status }));
  if (u.hostname === 'hts.usitc.gov') return j(HTS[u.searchParams.get('keyword')] || []);
  if (u.hostname === 'api.zippopotam.us') {
    if (u.pathname === '/us/90210') return j({ 'post code': '90210', country: 'United States', 'country abbreviation': 'US', places: [{ 'place name': 'Beverly Hills', longitude: '-118.4065', state: 'California', 'state abbreviation': 'CA', latitude: '34.0901' }] });
    return j({}, 404);
  }
  if (u.hostname === 'nominatim.openstreetmap.org') return j([]);
  if (u.hostname === 'open.er-api.com') return j(ER);
  if (u.hostname === 'api.frankfurter.dev' || u.hostname === 'cdn.jsdelivr.net') return j({}, 503);
  const m = /\/customers\/(ctm_[\w]+)$/.exec(u.pathname);
  if (u.hostname.endsWith('paddle.com') && m) return j({ data: { id: m[1], email: devCustomers.get(m[1]) || 'dev@example.com' } });
  if (u.hostname.endsWith('paddle.com') && /portal-sessions$/.test(u.pathname)) return j({ data: { urls: { general: { overview: `http://localhost:${port}/__dev/portal` } } } });
  return realFetch(input, init);
}
if (!live) globalThis.fetch = mockFetch;

// ---------- dev helpers ----------
async function devRoute(req, url, bodyText) {
  if (url.pathname === '/__dev/outbox') return Response.json(env.__outbox);
  if (url.pathname === '/__dev/events') return Response.json(events);
  if (url.pathname === '/__dev/portal') return new Response('<h1>Paddle customer portal (dev stub)</h1>', { headers: { 'content-type': 'text/html' } });
  if (url.pathname === '/__dev/subscribe' && req.method === 'POST') {
    const { email, status = 'active', lang = 'en' } = JSON.parse(bodyText || '{}');
    const cid = 'ctm_' + (await hmacHex('c', String(email))).slice(0, 12);
    devCustomers.set(cid, String(email).toLowerCase());
    const now = Date.now();
    const ev = {
      event_id: 'evt_dev_' + now + Math.random().toString(36).slice(2, 6), event_type: 'subscription.activated', occurred_at: new Date(now).toISOString(),
      data: { id: 'sub_' + cid, status, customer_id: cid, billing_cycle: { interval: 'month', frequency: 1 }, current_billing_period: { starts_at: new Date(now).toISOString(), ends_at: new Date(now + 30 * 86400e3).toISOString() }, scheduled_change: null, items: [{ price: { id: 'pri_dev' }, quantity: 1 }], custom_data: { lang } },
    };
    const raw = JSON.stringify(ev);
    const ts = Math.floor(now / 1000);
    const sig = `ts=${ts};h1=${await hmacHex(env.PADDLE_WEBHOOK_SECRET, `${ts}:${raw}`)}`;
    return worker.fetch(new Request(url.origin + '/api/paddle/webhook', { method: 'POST', headers: { 'paddle-signature': sig }, body: raw }), env, { waitUntil: () => {} });
  }
  return new Response('dev helper not found', { status: 404 });
}

const server = http.createServer(async (nreq, nres) => {
  try {
    const chunks = [];
    for await (const c of nreq) chunks.push(c);
    const buf = Buffer.concat(chunks);
    const url = new URL(nreq.url, `http://localhost:${port}`);
    const init = { method: nreq.method, headers: nreq.headers };
    if (!['GET', 'HEAD'].includes(nreq.method) && buf.length) init.body = buf;
    const req = new Request(url, init);
    const pending = [];
    let res;
    if (url.pathname.startsWith('/__dev/')) res = await devRoute(req, url, buf.toString('utf8'));
    else res = await worker.fetch(req, env, { waitUntil: (p) => pending.push(p) });
    nres.writeHead(res.status, Object.fromEntries(res.headers));
    nres.end(Buffer.from(await res.arrayBuffer()));
    await Promise.allSettled(pending);
  } catch (e) {
    console.error(e);
    nres.writeHead(500); nres.end('dev server error');
  }
});
server.listen(port, () => console.log(`dev server on http://localhost:${port}  (${live ? 'LIVE upstreams' : 'mocked upstreams'})`));
