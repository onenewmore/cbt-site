// Cloudflare Worker entry: API + redirects in front of the static site (served by the ASSETS binding).
import { json, err } from './util.mjs';
import { handleLogin, handleSession } from './auth.mjs';
import { handleMe, handleApiKey, handleWatch, handlePortal } from './pro.mjs';
import { handleWebhook } from './paddle.mjs';
import { handleProxy } from './proxy.mjs';
import { handleV1 } from './api.mjs';
import { handleLead, handleAdminLeads } from './leads.mjs';
import { handleGo } from './go.mjs';
import { handleEvent } from './events.mjs';
import { runScheduled } from './cron.mjs';

const ROUTES = [
  ['POST', '/api/e', (req, env) => handleEvent(req, env)],
  ['POST', '/api/lead', handleLead],
  ['POST', '/api/pro/login', (req, env) => handleLogin(req, env)],
  ['POST', '/api/pro/session', (req, env) => handleSession(req, env)],
  ['GET', '/api/pro/me', (req, env) => handleMe(req, env)],
  ['POST', '/api/pro/apikey', (req, env) => handleApiKey(req, env)],
  ['GET', '/api/pro/watch', (req, env) => handleWatch(req, env)],
  ['PUT', '/api/pro/watch', (req, env) => handleWatch(req, env)],
  ['POST', '/api/pro/portal', (req, env) => handlePortal(req, env)],
  ['POST', '/api/paddle/webhook', handleWebhook],
  ['GET', '/api/health', (req, env) => health(env)],
];

function health(env) {
  return json({
    ok: true,
    configured: {
      kv: !!env.CBT_KV, session: !!env.SESSION_SECRET, paddleWebhook: !!env.PADDLE_WEBHOOK_SECRET, paddleApi: !!env.PADDLE_API_KEY,
      mail: !!env.RESEND_API_KEY, analytics: !!env.EVENTS, turnstile: !!env.TURNSTILE_SECRET, leadsWebhook: !!env.LEADS_WEBHOOK_URL, adminToken: !!env.ADMIN_TOKEN,
    },
    paddleEnv: env.PADDLE_ENV || 'sandbox',
  });
}

export async function route(req, env, ctx) {
  const url = new URL(req.url);
  const p = url.pathname;
  try {
    if (p.startsWith('/go/')) return await handleGo(req, env, ctx);
    if (p.startsWith('/api/p/')) return await handleProxy(req, env, ctx);
    if (p.startsWith('/api/v1/')) return await handleV1(req, env, ctx);
    if (p === '/api/admin/leads') return await handleAdminLeads(req, env, ctx);
    if (p.startsWith('/api/')) {
      const r = ROUTES.find(([m, path]) => path === p && m === req.method);
      if (r) return await r[2](req, env, ctx);
      if (ROUTES.some(([, path]) => path === p)) return err(405, 'method_not_allowed');
      return err(404, 'not_found');
    }
  } catch (e) {
    console.error('unhandled', p, e && e.stack || e);
    return err(500, 'internal_error');
  }
  return null; // not ours -> static assets
}

export default {
  async fetch(req, env, ctx) {
    const res = await route(req, env, ctx);
    if (res) return res;
    return env.ASSETS.fetch(req);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(env).then((r) => console.log('cron', JSON.stringify(r))));
  },
};
