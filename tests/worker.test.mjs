// Worker tests: run with `node --test tests/`. No network: global fetch is replaced per test, KV is in memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.mjs';
import { MemoryKV } from '../scripts/memory-kv.mjs';
import { hmacHex, signToken, verifyToken, now } from '../worker/src/util.mjs';
import { isActive, GRACE_MS } from '../worker/src/entitlement.mjs';
import { verifyPaddleSignature } from '../worker/src/paddle.mjs';
import { runScheduled, diffFingerprints } from '../worker/src/cron.mjs';
import { refClass } from '../worker/src/events.mjs';
import partners from '../worker/src/generated/partners.mjs';

const SECRET = 'test-session-secret';
const WH = 'pdl_ntfset_test_secret';
const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; });

function makeEnv(extra = {}) {
  const events = [];
  return {
    CBT_KV: new MemoryKV(), SESSION_SECRET: SECRET, PADDLE_WEBHOOK_SECRET: WH, PADDLE_API_KEY: 'pdl_test', PADDLE_ENV: 'sandbox',
    SITE_URL: 'https://site.test', MAIL_FROM: 'Test <n@site.test>', ADMIN_TOKEN: 'admin-secret', CRON_DELAY_MS: 0,
    EVENTS: { writeDataPoint: (d) => events.push(d) }, __events: events, __outbox: [],
    ASSETS: { fetch: async () => new Response('static', { status: 200 }) },
    ...extra,
  };
}
async function call(env, path, { method = 'GET', headers = {}, body, json } = {}) {
  const pending = [];
  const init = { method, headers: { ...headers } };
  if (json !== undefined) { init.body = JSON.stringify(json); init.headers['content-type'] = 'application/json'; } else if (body !== undefined) init.body = body;
  const res = await worker.fetch(new Request('https://site.test' + path, init), env, { waitUntil: (p) => pending.push(p) });
  await Promise.all(pending);
  return res;
}
const body = async (res) => { const t = await res.text(); try { return JSON.parse(t); } catch { return t; } };

// ---- Paddle helpers ----
async function signedWebhook(env, event, { ts = Math.floor(now() / 1000), secret = WH } = {}) {
  const raw = JSON.stringify(event);
  const h1 = await hmacHex(secret, `${ts}:${raw}`);
  return call(env, '/api/paddle/webhook', { method: 'POST', headers: { 'paddle-signature': `ts=${ts};h1=${h1}` }, body: raw });
}
const subEvent = (id, type, over = {}, at = new Date().toISOString()) => ({
  event_id: id, event_type: type, occurred_at: at,
  data: {
    id: 'sub_01', status: 'active', customer_id: 'ctm_01', billing_cycle: { interval: 'month', frequency: 1 },
    current_billing_period: { starts_at: new Date(now() - 86400e3).toISOString(), ends_at: new Date(now() + 29 * 86400e3).toISOString() },
    scheduled_change: null, items: [{ price: { id: 'pri_01' }, quantity: 1 }], custom_data: { lang: 'en' }, ...over,
  },
});
function mockPaddleCustomer(email = 'Buyer@Example.com') {
  globalThis.fetch = async (u) => {
    if (String(u).includes('/customers/ctm_01') && !String(u).includes('portal')) return Response.json({ data: { id: 'ctm_01', email } });
    if (String(u).includes('/customers/ctm_01/portal-sessions')) return Response.json({ data: { urls: { general: { overview: 'https://portal.test/x' } } } });
    return new Response('{}', { status: 404 });
  };
}
async function signIn(env, email) {
  await call(env, '/api/pro/login', { method: 'POST', json: { email, lang: 'en' } });
  const mail = env.__outbox.filter((m) => m.to.includes(email)).pop();
  assert.ok(mail, 'login mail was sent');
  const token = decodeURIComponent(/[?&]t=([^\s&"]+)/.exec(mail.text)[1]);
  const r = await call(env, '/api/pro/session', { method: 'POST', json: { token } });
  const j = await body(r);
  return { status: r.status, session: j.session, token };
}
async function proUser(env) {
  mockPaddleCustomer();
  const r = await signedWebhook(env, subEvent('evt_1', 'subscription.activated'));
  assert.equal(r.status, 200);
  const s = await signIn(env, 'buyer@example.com');
  assert.equal(s.status, 200);
  return s.session.token;
}
const auth = (t) => ({ authorization: 'Bearer ' + t });

// ================= pure logic =================
test('signed tokens: valid, tampered, wrong type, expired', async () => {
  const t = await signToken('k', { t: 's', e: 'a@b.co', exp: Math.floor(now() / 1000) + 60 });
  assert.equal((await verifyToken('k', t, 's')).e, 'a@b.co');
  assert.equal(await verifyToken('k', t, 'm'), null);
  assert.equal(await verifyToken('other', t, 's'), null);
  assert.equal(await verifyToken('k', t.slice(0, -2) + 'xx', 's'), null);
  const old = await signToken('k', { t: 's', e: 'a@b.co', exp: Math.floor(now() / 1000) - 1 });
  assert.equal(await verifyToken('k', old, 's'), null);
});

test('entitlement matrix', () => {
  const t = 1_000_000_000_000;
  assert.equal(isActive(null, t), false);
  assert.equal(isActive({ status: 'active' }, t), true);
  assert.equal(isActive({ status: 'trialing' }, t), true);
  assert.equal(isActive({ status: 'past_due', periodEnd: t - 1000 }, t), true, 'grace');
  assert.equal(isActive({ status: 'past_due', periodEnd: t - GRACE_MS - 1 }, t), false, 'grace over');
  assert.equal(isActive({ status: 'canceled', periodEnd: t + 1000 }, t), true, 'paid period honoured');
  assert.equal(isActive({ status: 'canceled', periodEnd: t - 1 }, t), false);
  assert.equal(isActive({ status: 'canceled', periodEnd: null }, t), false);
  assert.equal(isActive({ status: 'paused', periodEnd: null }, t), false);
  assert.equal(isActive({ status: 'weird' }, t), false);
});

test('paddle signature: ok, bad secret, stale timestamp, rotated secret (two h1)', async () => {
  const raw = '{"a":1}';
  const ts = Math.floor(now() / 1000);
  const h1 = await hmacHex('s', `${ts}:${raw}`);
  assert.equal(await verifyPaddleSignature('s', `ts=${ts};h1=${h1}`, raw), true);
  assert.equal(await verifyPaddleSignature('x', `ts=${ts};h1=${h1}`, raw), false);
  assert.equal(await verifyPaddleSignature('s', `ts=${ts};h1=${h1}`, raw + ' '), false);
  assert.equal(await verifyPaddleSignature('s', `ts=${ts - 4000};h1=${await hmacHex('s', `${ts - 4000}:${raw}`)}`, raw), false);
  assert.equal(await verifyPaddleSignature('s', `ts=${ts};h1=deadbeef;h1=${h1}`, raw), true);
  assert.equal(await verifyPaddleSignature('s', '', raw), false);
});

test('event referrer classes', () => {
  assert.equal(refClass('www.google.com'), 'organic');
  assert.equal(refClass('cn.bing.com'), 'organic');
  assert.equal(refClass('www.baidu.com'), 'organic');
  assert.equal(refClass('google.co.uk'), 'organic');
  assert.equal(refClass('www.so.com'), 'organic');
  assert.equal(refClass('www.reddit.com'), 'social');
  assert.equal(refClass('t.co'), 'social');
  assert.equal(refClass('example.org'), 'other');
  assert.equal(refClass('direct'), 'direct');
  assert.equal(refClass('internal'), 'internal');
  assert.equal(refClass(''), 'direct');
});

// ================= routing / misc =================
test('unknown paths fall through to static assets; unknown /api returns 404 json', async () => {
  const env = makeEnv();
  assert.equal(await (await call(env, '/tools/')).text(), 'static');
  const r = await call(env, '/api/nope');
  assert.equal(r.status, 404);
  assert.equal((await body(r)).error, 'not_found');
  assert.equal((await call(env, '/api/pro/me', { method: 'POST' })).status, 405);
});

test('health reports configuration without leaking secrets', async () => {
  const env = makeEnv();
  const j = await body(await call(env, '/api/health'));
  assert.equal(j.ok, true);
  assert.equal(j.configured.session, true);
  assert.ok(!JSON.stringify(j).includes(SECRET));
});

// ================= auth =================
test('login: unknown email answers 200 but sends nothing; invalid email 400', async () => {
  const env = makeEnv();
  const r = await call(env, '/api/pro/login', { method: 'POST', json: { email: 'nobody@example.com' } });
  assert.equal(r.status, 200);
  assert.equal(env.__outbox.length, 0);
  assert.equal((await call(env, '/api/pro/login', { method: 'POST', json: { email: 'nope' } })).status, 400);
});

test('login rate limit per email', async () => {
  const env = makeEnv();
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await call(env, '/api/pro/login', { method: 'POST', json: { email: 'a@example.com' } })).status);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
});

test('magic link is single use and session works', async () => {
  const env = makeEnv();
  mockPaddleCustomer();
  await signedWebhook(env, subEvent('evt_1', 'subscription.activated'));
  const welcome = env.__outbox.pop();
  assert.match(welcome.subject, /Pro is active/);
  await call(env, '/api/pro/login', { method: 'POST', json: { email: 'buyer@example.com', lang: 'zh' } });
  const mail = env.__outbox.pop();
  assert.match(mail.text, /https:\/\/site\.test\/zh\/account\/\?t=/);
  const token = decodeURIComponent(/[?&]t=([^\s&]+)/.exec(mail.text)[1]);
  const a = await call(env, '/api/pro/session', { method: 'POST', json: { token } });
  assert.equal(a.status, 200);
  const s = (await body(a)).session;
  assert.ok(s.exp * 1000 > now());
  assert.equal((await call(env, '/api/pro/session', { method: 'POST', json: { token } })).status, 401, 'second use rejected');
  assert.equal((await call(env, '/api/pro/session', { method: 'POST', json: { token: 'garbage' } })).status, 401);
  const me = await body(await call(env, '/api/pro/me', { headers: auth(s.token) }));
  assert.equal(me.plan, 'pro');
  assert.equal(me.email, 'buyer@example.com');
  assert.equal((await call(env, '/api/pro/me')).status, 401);
  assert.equal((await call(env, '/api/pro/me', { headers: auth('x.y') })).status, 401);
});

// ================= Paddle webhook =================
test('webhook: bad signature 400, good one creates entitlement, duplicate is idempotent', async () => {
  const env = makeEnv();
  mockPaddleCustomer();
  const bad = await signedWebhook(env, subEvent('evt_x', 'subscription.created'), { secret: 'wrong' });
  assert.equal(bad.status, 400);
  const ok = await signedWebhook(env, subEvent('evt_a', 'subscription.created'));
  assert.equal(ok.status, 200);
  assert.equal((await body(ok)).status, 'active');
  const sub = JSON.parse(await env.CBT_KV.get('sub:buyer@example.com'));
  assert.equal(sub.customerId, 'ctm_01');
  assert.equal(sub.interval, 'month');
  assert.equal(sub.priceId, 'pri_01');
  const mails = env.__outbox.length;
  const dup = await signedWebhook(env, subEvent('evt_a', 'subscription.created'));
  assert.equal((await body(dup)).duplicate, true);
  assert.equal(env.__outbox.length, mails, 'no second welcome mail');
});

test('webhook: out-of-order older event is ignored; cancel with scheduled_change keeps access until period end', async () => {
  const env = makeEnv();
  mockPaddleCustomer();
  const t1 = new Date(now() - 1000).toISOString();
  const t0 = new Date(now() - 5000).toISOString();
  await signedWebhook(env, subEvent('e1', 'subscription.updated', { scheduled_change: { action: 'cancel', effective_at: new Date(now() + 29 * 86400e3).toISOString() } }, t1));
  const stale = await signedWebhook(env, subEvent('e0', 'subscription.updated', { status: 'past_due' }, t0));
  assert.equal((await body(stale)).stale, true);
  const sub = JSON.parse(await env.CBT_KV.get('sub:buyer@example.com'));
  assert.equal(sub.status, 'active');
  assert.equal(sub.cancelAtPeriodEnd, true);
});

test('webhook: canceled without a paid period revokes Pro and API keys stop working', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  const key = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  assert.match(key, /^cbt_live_[0-9a-f]{48}$/);
  assert.equal((await call(env, '/api/v1/volumetric?l=1&w=1&h=1', { headers: auth(key) })).status, 200);
  await signedWebhook(env, subEvent('evt_c', 'subscription.canceled', { status: 'canceled', current_billing_period: null }, new Date(now() + 1000).toISOString()));
  const me = await body(await call(env, '/api/pro/me', { headers: auth(token) }));
  assert.equal(me.plan, 'free');
  assert.equal((await call(env, '/api/v1/volumetric?l=1&w=1&h=1', { headers: auth(key) })).status, 403);
  assert.equal((await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) })).status, 403);
});

test('webhook: unknown event types are acknowledged; customer lookup failure returns 500 so Paddle retries', async () => {
  const env = makeEnv();
  const ign = await signedWebhook(env, { event_id: 'evt_t', event_type: 'transaction.completed', occurred_at: new Date().toISOString(), data: {} });
  assert.equal((await body(ign)).ignored, 'transaction.completed');
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  const fail = await signedWebhook(env, subEvent('evt_f', 'subscription.created'));
  assert.equal(fail.status, 500);
  assert.equal(await env.CBT_KV.get('evt:evt_f'), null, 'not marked processed, so a retry is accepted');
});

test('portal session url comes from Paddle', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  const r = await body(await call(env, '/api/pro/portal', { method: 'POST', headers: auth(token) }));
  assert.equal(r.url, 'https://portal.test/x');
});

// ================= API v1 =================
test('api: auth errors, volumetric, usage, headers', async () => {
  const env = makeEnv();
  assert.equal((await call(env, '/api/v1/volumetric?l=1&w=1&h=1')).status, 401);
  assert.equal((await call(env, '/api/v1/volumetric?l=1&w=1&h=1', { headers: auth('cbt_live_nope') })).status, 401);
  const token = await proUser(env);
  const key = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  const r = await call(env, '/api/v1/volumetric?l=40&w=30&h=20&divisor=5000&actual=3.2', { headers: auth(key) });
  assert.equal(r.status, 200);
  assert.deepEqual(await body(r), { volumetricKg: 4.8, actualKg: 3.2, chargeableKg: 4.8, divisor: 5000, qty: 1, basis: 'volumetric' });
  assert.equal(r.headers.get('x-ratelimit-limit-month'), '20000');
  assert.equal(r.headers.get('x-ratelimit-remaining-month'), '19999');
  const q = await call(env, '/api/v1/volumetric?l=40&w=30&h=20&qty=3&actual=3&roundHalf=1', { headers: { 'x-api-key': key } });
  const qj = await body(q);
  assert.equal(qj.volumetricKg, 14.4); assert.equal(qj.actualKg, 9); assert.equal(qj.chargeableKg, 14.5);
  const bad = await call(env, '/api/v1/volumetric?l=-1&w=1&h=1', { headers: auth(key) });
  assert.equal(bad.status, 400);
  assert.equal((await body(bad)).error, 'invalid_parameter');
  const u = await body(await call(env, '/api/v1/usage', { headers: auth(key) }));
  assert.equal(u.used, 2, 'successful calls are counted, 400s and usage are not');
  assert.equal((await call(env, '/api/v1/nothing', { headers: auth(key) })).status, 404);
});

test('api: rotating the key invalidates the old one', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  const k1 = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  const k2 = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  assert.notEqual(k1, k2);
  assert.equal((await call(env, '/api/v1/usage', { headers: auth(k1) })).status, 401);
  assert.equal((await call(env, '/api/v1/usage', { headers: auth(k2) })).status, 200);
  const stored = [...env.CBT_KV.m.keys()].filter((k) => k.startsWith('apikey:'));
  assert.equal(stored.length, 1);
  assert.ok(!JSON.stringify([...env.CBT_KV.m.values()]).includes(k2), 'plaintext key is never stored');
});

test('api: monthly quota and per-minute limit', async () => {
  const env = makeEnv({ API_MONTHLY_CALLS: '3', API_PER_MINUTE: '100' });
  const token = await proUser(env);
  const key = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await call(env, '/api/v1/volumetric?l=1&w=1&h=1', { headers: auth(key) })).status);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
  const over = await call(env, '/api/v1/volumetric?l=1&w=1&h=1', { headers: auth(key) });
  assert.equal((await body(over)).error, 'monthly_quota_exceeded');
  assert.equal(over.headers.get('x-ratelimit-remaining-month'), '0');

  const env2 = makeEnv({ API_PER_MINUTE: '2' });
  const t2 = await proUser(env2);
  const k2 = (await body(await call(env2, '/api/pro/apikey', { method: 'POST', headers: auth(t2) }))).apiKey;
  const c2 = [];
  for (let i = 0; i < 4; i++) c2.push((await call(env2, '/api/v1/usage', { headers: auth(k2) })).status);
  assert.deepEqual(c2, [200, 200, 429, 429]);
});

test('api: hs search, eu landed cost', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  const key = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  const hs = await body(await call(env, '/api/v1/hs/search?q=smartphone&limit=3', { headers: auth(key) }));
  assert.equal(hs.results[0].hs6, '851713');
  assert.equal(hs.results[0].code, '8517.13');
  assert.equal((await call(env, '/api/v1/hs/search?q=a', { headers: auth(key) })).status, 400);
  const zh = await body(await call(env, '/api/v1/hs/search?q=' + encodeURIComponent('蓝牙耳机'), { headers: auth(key) }));
  assert.ok(zh.results.length > 0);
  const eu = await body(await call(env, '/api/v1/eu/landed-cost?goods=1000&shipping=100&dutyPct=4&country=DE', { headers: auth(key) }));
  assert.equal(eu.vatPct, 19); assert.equal(eu.duty, 44); assert.equal(eu.vat, 217.36); assert.equal(eu.landedCost, 1361.36);
  const low = await body(await call(env, '/api/v1/eu/landed-cost?goods=100&shipping=10&dutyPct=4&country=FR&lowValue=true&lines=2', { headers: auth(key) }));
  assert.equal(low.lowValueFlatDutyApplied, true); assert.equal(low.duty, 6);
  assert.equal((await call(env, '/api/v1/eu/landed-cost?goods=1&country=US', { headers: auth(key) })).status, 400);
});

const HTS_FIXTURE = {
  '8517.13.00': [
    { htsno: '8517', description: 'Telephone sets', general: '' },
    { htsno: '8517.13.00', description: 'Smartphones', general: '' },
    { htsno: '8517.13.00.00', description: 'Smartphones', general: 'Free', special: '', other: '35%', footnotes: [{ columns: ['general'], value: 'See 9903.88.01.' }] },
  ],
  '9903.88.01': [{ htsno: '9903.88.01', description: 'Articles of China', general: 'The duty provided in the applicable subheading + 25%' }],
};
function mockHts(overrides = {}) {
  const calls = [];
  globalThis.fetch = async (u) => {
    const url = new URL(String(u));
    calls.push(String(u));
    if (url.hostname === 'hts.usitc.gov') {
      const kw = url.searchParams.get('keyword');
      const data = overrides[kw] || HTS_FIXTURE[kw] || [];
      return Response.json(data);
    }
    return new Response('{}', { status: 404 });
  };
  return calls;
}

test('api: US tariff composes MFN + legacy 301 + new 301 and estimates duty', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  const key = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  mockHts();
  const r = await body(await call(env, '/api/v1/tariff/us?hts=8517.13.00.00&origin=CN&value=1000', { headers: auth(key) }));
  assert.equal(r.baseRatePct, 0);
  assert.equal(r.legacy301Pct, 25);
  assert.equal(r.new301Pct, 12.5);
  assert.equal(r.totalPct, 37.5);
  assert.equal(r.estimatedDuty, 375);
  const vn = await body(await call(env, '/api/v1/tariff/us?hts=8517130000&origin=VN&value=1000', { headers: auth(key) }));
  assert.equal(vn.legacy301Pct, 0); assert.equal(vn.totalPct, 12.5);
  const xx = await body(await call(env, '/api/v1/tariff/us?hts=8517130000&origin=ZZ', { headers: auth(key) }));
  assert.equal(xx.new301Pct, null);
  assert.ok(xx.notes.some((n) => /not in the built-in list/.test(n)));
  assert.equal((await call(env, '/api/v1/tariff/us?hts=1234', { headers: auth(key) })).status, 400);
  mockHts({ '9999.99.99': [] });
  assert.equal((await call(env, '/api/v1/tariff/us?hts=9999.99.99', { headers: auth(key) })).status, 404);
});

test('api: rates are normalised, cross rates and amount work, unsupported currency is a 400', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  const key = (await body(await call(env, '/api/pro/apikey', { method: 'POST', headers: auth(token) }))).apiKey;
  globalThis.fetch = async (u) => {
    if (String(u).startsWith('https://open.er-api.com/')) return Response.json({ result: 'success', time_last_update_unix: 1760400000, rates: { USD: 1, CNY: 7, EUR: 0.9, GBP: 0.8, JPY: 150, CAD: 1.4, AUD: 1.5, CHF: 0.9 } });
    return new Response('{}', { status: 500 });
  };
  const r = await body(await call(env, '/api/v1/rates?base=USD&symbols=CNY,EUR&amount=10', { headers: auth(key) }));
  assert.equal(r.rates.CNY, 7); assert.equal(r.converted.CNY, 70); assert.equal(r.source, 'open.er-api.com');
  assert.match(r.attribution, /exchangerate-api/i);
  const x = await body(await call(env, '/api/v1/rates?base=EUR&symbols=CNY', { headers: auth(key) }));
  assert.equal(x.rates.CNY, Number((7 / 0.9).toPrecision(8)));
  assert.equal((await call(env, '/api/v1/rates?base=XXX', { headers: auth(key) })).status, 400);
  assert.equal((await call(env, '/api/v1/rates?symbols=ZZZ', { headers: auth(key) })).status, 400);
});

// ================= proxy =================
test('proxy: allow-listed paths only, upstream failure maps to 502', async () => {
  const env = makeEnv();
  const seen = [];
  globalThis.fetch = async (u) => { seen.push(String(u)); return Response.json({ ok: 1 }); };
  assert.equal((await call(env, '/api/p/evil/x')).status, 404);
  assert.equal((await call(env, '/api/p/hts/other')).status, 404);
  assert.equal((await call(env, '/api/p/hts/reststop/search?keyword=8517', {})).status, 200);
  assert.equal(seen[0], 'https://hts.usitc.gov/reststop/search?keyword=8517');
  assert.equal((await call(env, '/api/p/zip/us/90210')).status, 200);
  assert.equal(seen[1], 'https://api.zippopotam.us/us/90210');
  assert.equal((await call(env, '/api/p/zip/us/../../etc')).status, 404);
  assert.equal((await call(env, '/api/p/er/v6/latest/USD')).status, 200);
  assert.equal((await call(env, '/api/p/er/v6/latest/usd')).status, 404);
  assert.equal((await call(env, '/api/p/hts/reststop/search?keyword=1', { method: 'POST' })).status, 405);
  globalThis.fetch = async () => new Response('x', { status: 500 });
  assert.equal((await call(env, '/api/p/osm/search?q=a')).status, 502);
});

// ================= leads =================
const LEAD = { name: 'Li Wei', email: 'Li@Example.com', company: 'ACME', route: 'Shenzhen → LA', cargo: 'LED lamps', volume: '20 CBM', details: 'FCL', category: 'freight-forwarder', src: 'volumetric-weight-calculator', lang: 'en', consent: true };

test('lead: validation, honeypot, duplicate, storage, notification and webhook', async () => {
  const env = makeEnv({ LEAD_NOTIFY_EMAIL: 'owner@site.test', LEADS_WEBHOOK_URL: 'https://hook.test/in' });
  const hooks = [];
  globalThis.fetch = async (u, init) => { hooks.push({ u: String(u), body: init && init.body }); return new Response('ok'); };
  assert.equal((await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, consent: false } })).status, 400);
  assert.equal((await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, email: 'bad' } })).status, 400);
  assert.equal((await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, category: 'nope' } })).status, 400);
  assert.equal((await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, name: '' } })).status, 400);
  const hp = await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, website: 'http://spam' } });
  assert.equal(hp.status, 200);
  assert.equal([...env.CBT_KV.m.keys()].filter((k) => k.startsWith('lead:')).length, 0, 'honeypot stores nothing');
  const ok = await call(env, '/api/lead', { method: 'POST', json: LEAD });
  assert.equal(ok.status, 200);
  const keys = [...env.CBT_KV.m.keys()].filter((k) => k.startsWith('lead:'));
  assert.equal(keys.length, 1);
  const stored = JSON.parse(await env.CBT_KV.get(keys[0]));
  assert.equal(stored.email, 'li@example.com');
  assert.equal(stored.consent.version, 'v1-2026-10');
  assert.ok(!('ip' in stored));
  assert.equal(hooks.length, 1);
  assert.equal(JSON.parse(hooks[0].body).lead.category, 'freight-forwarder');
  assert.equal(env.__outbox.length, 1);
  assert.match(env.__outbox[0].subject, /\[lead\] freight-forwarder/);
  const dup = await body(await call(env, '/api/lead', { method: 'POST', json: LEAD }));
  assert.equal(dup.duplicate, true);
  assert.equal([...env.CBT_KV.m.keys()].filter((k) => k.startsWith('lead:')).length, 1);
  const w = await call(env, '/api/lead', { method: 'POST', json: { name: 'waitlist', email: 'w@example.com', category: 'pro-waitlist', consent: true, src: 'pricing' } });
  assert.equal(w.status, 200);
  assert.ok(env.__events.some((e) => e.indexes[0] === 'lead_server'));
});

test('lead: rate limit per IP and turnstile when configured', async () => {
  const env = makeEnv();
  const codes = [];
  for (let i = 0; i < 8; i++) codes.push((await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, email: `u${i}@example.com` } })).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 200, 429, 429]);
  const env2 = makeEnv({ TURNSTILE_SECRET: 'ts' });
  globalThis.fetch = async (u, init) => Response.json({ success: String(init.body).includes('response=good') });
  assert.equal((await call(env2, '/api/lead', { method: 'POST', json: LEAD })).status, 400);
  assert.equal((await call(env2, '/api/lead', { method: 'POST', json: { ...LEAD, turnstile: 'bad' } })).status, 400);
  assert.equal((await call(env2, '/api/lead', { method: 'POST', json: { ...LEAD, turnstile: 'good' } })).status, 200);
});

test('admin leads: auth, filter, csv, delete by email', async () => {
  const env = makeEnv();
  await call(env, '/api/lead', { method: 'POST', json: LEAD });
  await call(env, '/api/lead', { method: 'POST', json: { ...LEAD, email: 'b@example.com', category: 'payments' } });
  assert.equal((await call(env, '/api/admin/leads')).status, 401);
  assert.equal((await call(env, '/api/admin/leads', { headers: auth('wrong') })).status, 401);
  const all = await body(await call(env, '/api/admin/leads', { headers: auth('admin-secret') }));
  assert.equal(all.count, 2);
  const pay = await body(await call(env, '/api/admin/leads?category=payments', { headers: auth('admin-secret') }));
  assert.equal(pay.count, 1);
  const csv = await (await call(env, '/api/admin/leads?format=csv', { headers: auth('admin-secret') })).text();
  assert.match(csv.split('\n')[0], /^ts,category,src,lang,name,email/);
  assert.equal(csv.trim().split('\n').length, 3);
  const del = await body(await call(env, '/api/admin/leads?email=b@example.com', { method: 'DELETE', headers: auth('admin-secret') }));
  assert.equal(del.removed, 1);
  assert.equal((await body(await call(env, '/api/admin/leads', { headers: auth('admin-secret') }))).count, 1);
  const noAdmin = makeEnv({ ADMIN_TOKEN: '' });
  assert.equal((await call(noAdmin, '/api/admin/leads', { headers: { authorization: 'Bearer ' } })).status, 401);
});

// ================= /go =================
test('go: unknown partner 404, configured partner redirects with tokens and logs a server-side event', async () => {
  const env = makeEnv();
  assert.equal((await call(env, '/go/acme-freight')).status, 404);
  partners.categories['freight-forwarder'].partners.push({ id: 'acme-freight', name: 'Acme', url: 'https://acme.test/r?aff=123&sub={src}&c={click}' });
  partners.categories.payments.partners.push({ id: 'bad-scheme', name: 'Bad', url: 'javascript:alert(1)' });
  try {
    const r = await call(env, '/go/acme-freight?src=volumetric-weight-calculator%22%3E');
    assert.equal(r.status, 302);
    const loc = new URL(r.headers.get('location'));
    assert.equal(loc.hostname, 'acme.test');
    assert.equal(loc.searchParams.get('aff'), '123');
    assert.equal(loc.searchParams.get('sub'), 'volumetric-weight-calculator');
    assert.match(loc.searchParams.get('c'), /^[0-9a-f]{12}$/);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    const ev = env.__events.find((e) => e.indexes[0] === 'affiliate_redirect');
    assert.ok(ev);
    assert.equal(ev.blobs[8], 'freight-forwarder');
    assert.equal(ev.blobs[10], 'acme-freight');
    assert.equal((await call(env, '/go/bad-scheme')).status, 404);
    assert.equal((await call(env, '/go/..%2Fetc')).status, 404);
  } finally {
    partners.categories['freight-forwarder'].partners.pop();
    partners.categories.payments.partners.pop();
  }
});

// ================= events =================
test('events: valid event is written with the documented layout; bots, unknown names and junk are dropped', async () => {
  const env = makeEnv();
  const post = (payload, ua = 'Mozilla/5.0 (iPhone) Mobile') => call(env, '/api/e', { method: 'POST', headers: { 'user-agent': ua, 'content-type': 'text/plain' }, body: typeof payload === 'string' ? payload : JSON.stringify(payload) });
  const r = await post({ n: 'pageview', p: { lang: 'zh', page: '/tools/hs-code-lookup/', type: 'tool', ref: 'www.google.com' } });
  assert.equal(r.status, 204);
  assert.equal(env.__events.length, 1);
  const d = env.__events[0];
  assert.equal(d.indexes[0], 'pageview');
  assert.deepEqual(d.doubles, [1]);
  assert.equal(d.blobs.length, 17);
  assert.equal(d.blobs[0], 'pageview'); assert.equal(d.blobs[1], 'zh'); assert.equal(d.blobs[2], '/tools/hs-code-lookup/');
  assert.equal(d.blobs[5], 'organic'); assert.equal(d.blobs[6], 'www.google.com'); assert.equal(d.blobs[16], 'mobile');
  await post({ n: 'return_visit', p: { lang: 'en', page: '/', ref: 'cn.bing.com', visits: '5+', since_first_days: '7-29', since_last_days: '1' } });
  const rv = env.__events[1];
  assert.equal(rv.blobs[5], 'organic', 'visit events carry the referrer class too');
  assert.equal(rv.blobs[11], '5+'); assert.equal(rv.blobs[12], '7-29'); assert.equal(rv.blobs[13], '1');
  await post({ n: 'hack_the_planet', p: {} });
  await post('not json');
  await post({ n: 'pageview', p: {} }, 'Googlebot/2.1');
  await post('x'.repeat(5000));
  assert.equal(env.__events.length, 2);
  assert.equal((await call(env, '/api/e')).status, 405);
  const noEv = makeEnv({ EVENTS: undefined });
  assert.equal((await call(noEv, '/api/e', { method: 'POST', body: JSON.stringify({ n: 'pageview', p: {} }) })).status, 204);
});

// ================= watchlist + cron =================
test('watchlist: normalises codes, enforces the limit, requires Pro', async () => {
  const env = makeEnv({ WATCH_MAX_CODES: '3' });
  const token = await proUser(env);
  const put = await body(await call(env, '/api/pro/watch', { method: 'PUT', headers: auth(token), json: { codes: ['8517.13', '8517130000', '851713', '61091000', '39269099', '12', 'abc', '73181500'], digest: false } }));
  assert.deepEqual(put.codes, ['8517.13', '8517.13.00.00', '6109.10.00']);
  assert.equal(put.limited, true);
  assert.equal(put.digest, false);
  const get = await body(await call(env, '/api/pro/watch', { headers: auth(token) }));
  assert.deepEqual(get.codes, put.codes);
  assert.equal((await call(env, '/api/pro/watch')).status, 401);
  const free = makeEnv();
  free.CBT_KV.put('sub:free@example.com', JSON.stringify({ status: 'canceled', periodEnd: null }));
  const tok = await signToken(SECRET, { t: 's', e: 'free@example.com', exp: Math.floor(now() / 1000) + 600 });
  assert.equal((await call(free, '/api/pro/watch', { headers: auth(tok) })).status, 403);
});

test('cron: detects a rate change on a watched code, emails once, then is quiet; sends policy digest once', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  env.__outbox.length = 0;
  await call(env, '/api/pro/watch', { method: 'PUT', headers: auth(token), json: { codes: ['6109.10.00'], digest: true } });
  const line = (general) => [{ htsno: '6109', general: '' }, { htsno: '6109.10.00', description: 'T-shirts, cotton', general, special: '', other: '90%', footnotes: [] }];
  globalThis.fetch = async (u) => Response.json(line('16.5%'));
  let rep = await runScheduled(env);
  assert.equal(rep.codesChecked, 1); assert.equal(rep.changed, 0); assert.equal(rep.alertsSent, 0);
  rep = await runScheduled(env);
  assert.equal(rep.changed, 0, 'unchanged data is quiet');
  globalThis.fetch = async () => Response.json(line('20%'));
  rep = await runScheduled(env);
  assert.equal(rep.changed, 1); assert.equal(rep.alertsSent, 1);
  const mail = env.__outbox.find((m) => /HTS change/.test(m.subject));
  assert.ok(mail); assert.match(mail.text, /general: "16\.5%" → "20%"/);
  rep = await runScheduled(env);
  assert.equal(rep.changed, 0);

  // digest: nothing new at first; add an update and it is sent exactly once
  assert.equal(rep.digestsSent, 0);
  const policy = (await import('../worker/src/generated/policy-updates.mjs')).default;
  policy.updates.push({ id: 'test-update', date: '2099-01-01', region: 'US', title: { en: 'Test change', zh: '测试变更' }, summary: { en: 'Something changed.', zh: '有变化。' } });
  try {
    rep = await runScheduled(env);
    assert.equal(rep.digestsSent, 1);
    assert.ok(env.__outbox.some((m) => /Policy update: Test change/.test(m.subject)));
    rep = await runScheduled(env);
    assert.equal(rep.digestsSent, 0);
  } finally { policy.updates.pop(); }
});

test('cron: users whose plan lapsed receive nothing and their codes are not fetched', async () => {
  const env = makeEnv();
  const token = await proUser(env);
  await call(env, '/api/pro/watch', { method: 'PUT', headers: auth(token), json: { codes: ['6109.10.00'], digest: true } });
  await signedWebhook(env, subEvent('evt_end', 'subscription.canceled', { status: 'canceled', current_billing_period: null }, new Date(now() + 1000).toISOString()));
  let fetches = 0;
  globalThis.fetch = async () => { fetches++; return Response.json([]); };
  const rep = await runScheduled(env);
  assert.equal(rep.users, 0); assert.equal(fetches, 0);
});

test('diffFingerprints describes changes', () => {
  const a = { kind: 'line', general: 'Free', special: '', other: '35%', description: 'x', chapter99: ['9903.88.01'] };
  const b = { kind: 'line', general: '5%', special: '', other: '35%', description: 'x', chapter99: ['9903.88.02'] };
  assert.deepEqual(diffFingerprints(a, b), ['general: "Free" → "5%"', 'Chapter 99 added: 9903.88.02', 'Chapter 99 removed: 9903.88.01']);
  assert.deepEqual(diffFingerprints({ kind: 'list', lines: ['a | 1'] }, { kind: 'list', lines: ['a | 1', 'b | 2'] }), ['+ b | 2']);
});

// ---- one-time pass (WeChat Pay / Alipay) ----
import { extendPass, passActive, PASS_DAYS } from '../worker/src/entitlement.mjs';
import { passPriceIn } from '../worker/src/paddle.mjs';

test('pass: extends from the later of now and the current end; price matching ignores subscriptions', () => {
  const t = 1_800_000_000_000, day = 86_400_000;
  const a = extendPass(null, 'txn_1', t);
  assert.equal(a.periodEnd, t + PASS_DAYS * day);
  const b = extendPass(a, 'txn_2', t + 10 * day);
  assert.equal(b.periodEnd, t + 2 * PASS_DAYS * day, 'buying early stacks');
  assert.deepEqual(b.txns, ['txn_1', 'txn_2']);
  const c = extendPass({ periodEnd: t - day, txns: ['txn_0'] }, 'txn_3', t);
  assert.equal(c.periodEnd, t + PASS_DAYS * day, 'expired pass restarts from now');
  assert.equal(passActive(a, t + day), true);
  assert.equal(passActive(a, a.periodEnd + 1), false);
  assert.equal(passPriceIn({ items: [{ price: { id: 'pri_pass' } }] }, 'pri_pass'), true);
  assert.equal(passPriceIn({ subscription_id: 'sub_1', items: [{ price: { id: 'pri_pass' } }] }, 'pri_pass'), false);
  assert.equal(passPriceIn({ items: [{ price: { id: 'pri_other' } }] }, 'pri_pass'), false);
  assert.equal(passPriceIn({ items: [{ price: { id: 'pri_pass' } }] }, ''), false);
});

test('webhook: transaction.completed for the pass grants Pro once, sign-in works, other transactions are ignored', async () => {
  const env = makeEnv({ PADDLE_PRICE_PASS: 'pri_pass' });
  mockPaddleCustomer('wechat@example.com');
  const txn = (eid, tid, price = 'pri_pass') => ({ event_id: eid, event_type: 'transaction.completed', occurred_at: new Date().toISOString(),
    data: { id: tid, status: 'completed', customer_id: 'ctm_01', subscription_id: null, items: [{ price: { id: price }, quantity: 1 }], custom_data: { lang: 'zh' } } });
  let r = await signedWebhook(env, txn('evt_t0', 'txn_other', 'pri_other'));
  assert.equal((await body(r)).ignored, 'transaction.completed');
  r = await signedWebhook(env, txn('evt_t1', 'txn_a'));
  const b1 = await body(r);
  assert.equal(b1.pass, true);
  r = await signedWebhook(env, txn('evt_t2', 'txn_a'));
  assert.equal((await body(r)).duplicate, true, 'same transaction under a new event id does not add another year');
  const pass = JSON.parse(await env.CBT_KV.get('pass:wechat@example.com'));
  assert.equal(pass.periodEnd, b1.periodEnd);
  const s = await signIn(env, 'wechat@example.com');
  assert.equal(s.status, 200);
  const me = await body(await call(env, '/api/pro/me', { headers: auth(s.session.token) }));
  assert.equal(me.plan, 'pro');
  assert.equal(me.interval, 'pass');
});
