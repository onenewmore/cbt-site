// Core helpers: config, URL building, escaping, placeholder + link resolution.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LANGS = ['en', 'zh'];
export const HTML_LANG = { en: 'en', zh: 'zh-Hans' };

export function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

export function loadConfig() {
  const cfg = readJson('config/site.config.json');
  const env = process.env;
  if (env.SITE_URL) cfg.siteUrl = env.SITE_URL;
  if (env.CONTACT_EMAIL) cfg.contactEmail = env.CONTACT_EMAIL;
  if (env.COMPANY_NAME) cfg.company = env.COMPANY_NAME;
  if (env.PADDLE_CLIENT_TOKEN) cfg.paddle.clientToken = env.PADDLE_CLIENT_TOKEN;
  if (env.PADDLE_ENV) cfg.paddle.env = env.PADDLE_ENV;
  if (env.PADDLE_PRICE_MONTHLY) cfg.paddle.prices.monthly = env.PADDLE_PRICE_MONTHLY;
  if (env.PADDLE_PRICE_ANNUAL) cfg.paddle.prices.annual = env.PADDLE_PRICE_ANNUAL;
  if (env.PADDLE_PRICE_PASS) cfg.paddle.prices.pass = env.PADDLE_PRICE_PASS;
  if (env.PLAUSIBLE_DOMAIN) cfg.analytics.plausibleDomain = env.PLAUSIBLE_DOMAIN;
  if (env.GOVERNING_LAW) cfg.governingLaw = env.GOVERNING_LAW;
  if (env.TURNSTILE_SITE_KEY) cfg.turnstileSiteKey = env.TURNSTILE_SITE_KEY;
  cfg.siteUrl = cfg.siteUrl.replace(/\/+$/, '');
  return cfg;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const escJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// '/tools/x/' -> '/tools/x/' (en) or '/zh/tools/x/' (zh)
export function url(lang, p) {
  if (!p.startsWith('/')) throw new Error('path must start with /: ' + p);
  return lang === 'zh' ? '/zh' + p : p;
}
export const abs = (cfg, lang, p) => cfg.siteUrl + url(lang, p);

// named pages used in {{page:…}} tokens
export const PAGES = {
  home: '/', tools: '/tools/', 'image-size': '/image-size/', 'hs-code': '/hs-code/', guides: '/guides/', 'policy-updates': '/policy-updates/',
  pricing: '/pricing/', account: '/account/', bulk: '/pro/bulk/', api: '/docs/api/', quotes: '/get-quotes/',
  privacy: '/privacy/', terms: '/terms/', refund: '/refund/', 'affiliate-disclosure': '/affiliate-disclosure/', about: '/about/', contact: '/contact/',
};

export function resolveTokens(html, lang, cfg) {
  const analyticsProvider = cfg.analyticsProviderLabel
    || (cfg.analytics.plausibleDomain ? 'Plausible Analytics (cookie-free) and our own first-party event endpoint' : 'our own first-party event endpoint (no cookies)');
  const map = {
    COMPANY_NAME: cfg.company, CONTACT_EMAIL: cfg.contactEmail, GOVERNING_LAW: cfg.governingLaw, REFUND_DAYS: String(cfg.refundDays),
    ANALYTICS_PROVIDER: analyticsProvider,
  };
  return String(html)
    .replace(/\{\{tool:([a-z0-9-]+)\}\}/g, (_, s) => url(lang, `/tools/${s}/`))
    .replace(/\{\{page:([a-z0-9-]+)\}\}/g, (_, k) => {
      if (!PAGES[k]) throw new Error('unknown page token: ' + k);
      return url(lang, PAGES[k]);
    })
    .replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in map ? map[k] : m));
}

export function findPlaceholders(html) {
  return [...new Set((String(html).match(/\{\{[A-Za-z_:-]+\}\}/g) || []))];
}

export function writeFile(dist, rel, data) {
  const out = path.join(dist, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, data);
}

export function copyDir(src, dst, filter = () => true) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (!filter(s, ent)) continue;
    if (ent.isDirectory()) copyDir(s, d, filter);
    else fs.copyFileSync(s, d);
  }
}
