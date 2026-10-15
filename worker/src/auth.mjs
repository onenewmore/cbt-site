// Passwordless sign-in. Magic link (15 min, single use) -> stateless signed session token (30 days).
// The link opens the static /account/ page; the page's JS exchanges the token, so mail scanners that only fetch URLs cannot burn it.
import { json, err, readJson, signToken, verifyToken, randomHex, normEmail, isEmail, clientIp, kvLimit, now } from './util.mjs';
import { sendMail, layoutEmail } from './mail.mjs';
import { getSub, getPass } from './entitlement.mjs';

export const MAGIC_TTL_S = 15 * 60;
export const SESSION_TTL_S = 30 * 86_400;

const T = {
  en: {
    subject: 'Your sign-in link', heading: 'Sign in', lead: 'Use the button below to sign in to your Pro account. The link works once and expires in 15 minutes.',
    button: 'Sign in', ignore: 'If you did not request this, you can ignore this email.',
    welcomeSubject: 'Pro is active', welcomeHeading: 'Welcome to Pro', welcomeLead: 'Your subscription is active. Sign in to create your API key, set up policy alerts and manage billing.',
  },
  zh: {
    subject: '你的登录链接', heading: '登录', lead: '点击下方按钮登录你的 Pro 账户。链接只能使用一次，15 分钟内有效。',
    button: '登录', ignore: '如果不是你本人操作，请忽略这封邮件。',
    welcomeSubject: 'Pro 已开通', welcomeHeading: '欢迎使用 Pro', welcomeLead: '你的订阅已生效。登录后可以生成 API Key、设置政策提醒并管理账单。',
  },
};

export async function createMagicLink(env, email, lang) {
  const jti = randomHex(16);
  const exp = Math.floor(now() / 1000) + MAGIC_TTL_S;
  const token = await signToken(env.SESSION_SECRET, { t: 'm', e: email, jti, exp });
  await env.CBT_KV.put(`magic:${jti}`, '1', { expirationTtl: MAGIC_TTL_S + 60 });
  const prefix = lang === 'zh' ? '/zh' : '';
  return `${env.SITE_URL}${prefix}/account/?t=${encodeURIComponent(token)}`;
}

export async function sendLoginEmail(env, email, lang, { welcome = false } = {}) {
  const m = T[lang] || T.en;
  const href = await createMagicLink(env, email, lang);
  const heading = welcome ? m.welcomeHeading : m.heading;
  const lead = welcome ? m.welcomeLead : m.lead;
  return sendMail(env, {
    to: email,
    subject: welcome ? m.welcomeSubject : m.subject,
    text: `${lead}\n\n${href}\n\n${m.ignore}`,
    html: layoutEmail({ lang, heading, paragraphs: [lead], button: { href, label: m.button }, footer: m.ignore }),
  });
}

// POST /api/pro/login — always answers 200 so the endpoint cannot be used to find out who has a plan.
export async function handleLogin(req, env) {
  if (!env.SESSION_SECRET) return err(503, 'not_configured');
  let body;
  try { body = await readJson(req, 2048); } catch (e) { return err(e.status || 400, 'bad_request'); }
  const email = normEmail(body.email);
  const lang = body.lang === 'zh' ? 'zh' : 'en';
  if (!isEmail(email)) return err(400, 'invalid_email');
  const ip = clientIp(req);
  const a = await kvLimit(env, 'login-ip', ip, 8, 600);
  const b = await kvLimit(env, 'login-email', email, 3, 600);
  if (!a.ok || !b.ok) return err(429, 'rate_limited', undefined, { 'retry-after': String(Math.max(a.retryAfter, b.retryAfter)) });
  const known = (await getSub(env, email)) || (await getPass(env, email));
  if (known) await sendLoginEmail(env, email, lang);
  return json({ ok: true });
}

// POST /api/pro/session {token} -> {session:{token,exp}}
export async function handleSession(req, env) {
  if (!env.SESSION_SECRET) return err(503, 'not_configured');
  let body;
  try { body = await readJson(req, 4096); } catch (e) { return err(e.status || 400, 'bad_request'); }
  const p = await verifyToken(env.SESSION_SECRET, body.token, 'm');
  if (!p) return err(401, 'invalid_or_expired');
  const seen = await env.CBT_KV.get(`magic:${p.jti}`);
  if (!seen) return err(401, 'invalid_or_expired');
  await env.CBT_KV.delete(`magic:${p.jti}`);
  const exp = Math.floor(now() / 1000) + SESSION_TTL_S;
  const token = await signToken(env.SESSION_SECRET, { t: 's', e: p.e, exp });
  return json({ session: { token, exp } });
}

// Returns the signed-in email or null.
export async function sessionEmail(req, env) {
  const h = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  if (!m || !env.SESSION_SECRET) return null;
  const p = await verifyToken(env.SESSION_SECRET, m[1], 's');
  return p ? p.e : null;
}
