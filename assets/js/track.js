// First-party, cookie-free analytics helpers. Events go to Plausible (if configured) and to our own /api/e beacon.
export const cfg = JSON.parse(document.getElementById('cbt-config').textContent);

export function track(name, props = {}, opts = {}) {
  const base = { lang: cfg.lang, page: cfg.path, type: cfg.type, ...props };
  try { if (window.plausible && opts.plausible !== false) window.plausible(name, { props: base }); } catch { /* ignore */ }
  if (cfg.analytics && cfg.analytics.firstPartyBeacon) {
    try {
      const body = JSON.stringify({ n: name, p: base });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/e', new Blob([body], { type: 'text/plain' }));
      else fetch('/api/e', { method: 'POST', body, keepalive: true });
    } catch { /* ignore */ }
  }
}

const bucket = (d) => (d < 1 ? '0' : d < 2 ? '1' : d < 7 ? '2-6' : d < 30 ? '7-29' : '30+');

// A "visit" starts after 30 minutes of inactivity. We store three numbers locally and report anonymous buckets.
export function trackVisit(ref = 'direct') {
  try {
    const S = window.localStorage;
    const now = Date.now();
    let first = Number(S.getItem('cbt_first')) || 0;
    const last = Number(S.getItem('cbt_last')) || 0;
    let n = Number(S.getItem('cbt_visits')) || 0;
    if (!first) { first = now; S.setItem('cbt_first', String(first)); }
    if (!last || now - last > 30 * 60 * 1000) {
      n += 1;
      S.setItem('cbt_visits', String(n));
      if (n > 1) track('return_visit', { ref, visits: n >= 5 ? '5+' : String(n), since_first_days: bucket((now - first) / 864e5), since_last_days: bucket((now - last) / 864e5) });
      else track('new_visitor', { ref });
    }
    S.setItem('cbt_last', String(now));
  } catch { /* storage unavailable */ }
}
