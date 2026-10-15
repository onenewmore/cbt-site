# End-to-end checks in a real browser against the dev server (mocked upstreams, in-memory KV, captured mail).
#   python3 tests/e2e_site.py            starts scripts/dev.mjs on :8792 itself
#   E2E_BASE=http://localhost:8791 python3 tests/e2e_site.py   use an already running server
import os, sys, json, re, time, subprocess, traceback, urllib.request
from playwright.sync_api import sync_playwright, expect

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.environ.get('E2E_BASE')
srv = None
if not BASE:
    BASE = 'http://localhost:8792'
    srv = subprocess.Popen(['node', 'scripts/dev.mjs', '--port', '8792'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(40):
        try:
            urllib.request.urlopen(BASE + '/api/health'); break
        except Exception:
            time.sleep(0.25)

UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
PHOTOS = [os.path.join(ROOT, 'tests/fixtures/photo%d.jpg' % i) for i in range(1, 7)]
results = []


def check(name, ok, info=''):
    results.append((name, bool(ok), info))
    print(('PASS ' if ok else 'FAIL ') + name + ((' — ' + str(info)) if (info and not ok) else ''))


def scenario(fn):
    def run(*a, **k):
        try:
            fn(*a, **k)
        except Exception as e:
            check(fn.__name__ + ' (exception)', False, ''.join(traceback.format_exception_only(type(e), e)).strip()[:300])
            traceback.print_exc(limit=3)
    return run


def api(path, method='GET', body=None, headers=None):
    req = urllib.request.Request(BASE + path, method=method, headers=headers or {}, data=(json.dumps(body).encode() if body is not None else None))
    if body is not None:
        req.add_header('content-type', 'application/json')
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or 'null')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or 'null')


def newpage(ctx, errors):
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('pageerror:' + str(e)))
    page.on('console', lambda m: errors.append('console:' + m.text) if m.type == 'error' else None)
    return page


@scenario
def tools_work(ctx, errors):
    p = newpage(ctx, errors)
    p.goto(BASE + '/tools/volumetric-weight-calculator/', wait_until='networkidle')
    p.fill('#v-l', '40'); p.fill('#v-w', '30'); p.fill('#v-h', '20'); p.fill('#v-act', '3.2')
    p.click('#v-go')
    check('volumetric: 40x30x20 /5000 = 4.8 KG', '4.8' in p.inner_text('#v-res'), p.inner_text('#v-res'))
    check('volumetric: billable weight shown', 'Billable' in p.inner_text('#v-sub'))

    p.goto(BASE + '/tools/us-tariff-calculator/', wait_until='networkidle')
    p.fill('#us-hs', '8517.13.00.00'); p.fill('#us-val', '1000'); p.click('#us-go')
    p.wait_for_selector('#us-out .results')
    out = p.inner_text('#us-out')
    check('us tariff: CN smartphone = 0 + 25 + 12.5 = 37.5%', '37.5%' in out, out[:200])
    check('us tariff: duty on $1,000 = $375', '$375' in out, out[:200])
    check('us tariff: export bar present (Pro)', p.locator('.exp-bar .btn').count() >= 1)

    p.goto(BASE + '/tools/postal-code-lookup/', wait_until='networkidle')
    p.select_option('#zip-cc', 'US'); p.fill('#zip-code', '90210'); p.click('#zip-go')
    p.wait_for_selector('#zip-out :text("Beverly Hills")', timeout=8000)
    check('postal: 90210 -> Beverly Hills via /api/p/zip proxy', True)

    reqs = []
    p.on('request', lambda r: reqs.append(r.url))
    p.goto(BASE + '/tools/currency-converter/', wait_until='networkidle')
    p.wait_for_selector('#fx-out :text("CNY")', timeout=8000)
    check('currency: rates loaded through same-origin proxy', any('/api/p/er/v6/latest/USD' in u for u in reqs), reqs[:5])
    check('currency: no direct third-party calls', not any(re.match(r'https://(open\.er-api|api\.frankfurter|cdn\.jsdelivr)', u) for u in reqs), [u for u in reqs if 'http' in u and BASE not in u][:3])

    p.goto(BASE + '/tools/hs-code-lookup/', wait_until='networkidle')
    p.fill('#hs-q', 'smartphone'); p.click('#hs-go')
    p.wait_for_selector('#hs-out :text("8517.13")', timeout=8000)
    check('hs lookup: smartphone -> 8517.13', True)

    p.goto(BASE + '/tools/country-codes/', wait_until='networkidle')
    check('country codes: server-rendered table includes Japan / JP', 'JP' in p.inner_text('main') and 'Japan' in p.inner_text('main'))
    p.close()


@scenario
def chinese_pages(ctx, errors):
    p = newpage(ctx, errors)
    p.goto(BASE + '/tools/volumetric-weight-calculator/', wait_until='networkidle')
    href = p.get_attribute('.lang-switch', 'href')
    check('lang switch points to the /zh/ twin', href == '/zh/tools/volumetric-weight-calculator/', href)
    p.goto(BASE + href, wait_until='networkidle')
    check('zh page: html lang zh-Hans', p.get_attribute('html', 'lang') == 'zh-Hans')
    check('zh page: tool UI is Chinese', '体积重' in p.inner_text('#tool-mount'), p.inner_text('#tool-mount')[:80])
    alts = p.eval_on_selector_all('link[rel=alternate]', 'els => els.map(e => e.hreflang + "|" + e.href)')
    check('zh page: hreflang en / zh-Hans / x-default', len(alts) == 3 and any(a.startswith('x-default') for a in alts), alts)
    p.close()


@scenario
def free_limits(ctx, errors):
    p = newpage(ctx, errors)
    p.goto(BASE + '/tools/image-resizer-for-marketplaces/', wait_until='networkidle')
    p.set_input_files('#img-file', PHOTOS)
    p.wait_for_selector('.paywall')
    check('free: 6 images -> paywall mentions the 3-image limit', '3 images' in p.inner_text('.paywall'), p.inner_text('.paywall'))
    p.click('.paywall [data-close]')
    p.wait_for_function('document.querySelectorAll(".img-row").length >= 3')
    p.wait_for_timeout(1500)
    n = p.locator('.img-row').count()
    check('free: only 3 images were processed', n == 3, n)
    p.wait_for_function('[...document.querySelectorAll(".img-row .img-detail")].every(e => e.textContent.trim() && !/^(Working|处理中)/.test(e.textContent.trim()))', timeout=40000)
    p.click('#img-zip')
    p.wait_for_selector('.paywall')
    check('free: ZIP download is gated', 'ZIP' in p.inner_text('.paywall'))
    p.click('.paywall [data-close]')
    p.goto(BASE + '/tools/us-tariff-calculator/', wait_until='networkidle')
    p.fill('#us-hs', '8517.13.00.00'); p.click('#us-go'); p.wait_for_selector('#us-out .results')
    p.click('.exp-bar .btn')
    p.wait_for_selector('.paywall')
    check('free: CSV export is gated', 'CSV' in p.inner_text('.paywall'))
    p.close()

    p = newpage(ctx, errors)
    p.goto(BASE + '/pro/bulk/', wait_until='networkidle')
    p.click('#b-sample'); p.click('#b-run')
    p.wait_for_selector('#b-out table, #b-out .tbl')
    rows = p.locator('#b-out tbody tr').count()
    check('free: bulk preview limited to 5 rows (sample has 6)', rows == 5, rows)
    check('free: bulk run shows the preview paywall', 'first 5 rows' in p.inner_text('.paywall'), p.inner_text('.paywall'))
    p.click('.paywall [data-close]')
    p.click('#b-exp')
    p.wait_for_selector('.paywall')
    check('free: bulk CSV export is gated', 'CSV' in p.inner_text('.paywall'))
    p.close()


@scenario
def leads_and_waitlist(ctx, errors):
    p = newpage(ctx, errors)
    p.goto(BASE + '/pricing/', wait_until='networkidle')
    check('pricing: waitlist hidden until requested', not p.is_visible('#waitlist'))
    p.click('#buy')
    p.wait_for_selector('#waitlist', state='visible')
    p.fill('#waitlist [name=email]', 'wait@example.com')
    p.click('#waitlist [name=consent]')
    p.click('#waitlist button[type=submit]')
    p.wait_for_selector('#waitlist .form-msg.ok')
    check('pricing: waitlist submit succeeds', True)
    p.close()

    p = newpage(ctx, errors)
    p.goto(BASE + '/get-quotes/freight-forwarders/?src=volumetric-weight-calculator', wait_until='networkidle')
    p.click('[data-lead-form] button[type=submit]')
    check('quote form: client-side validation blocks empty submit', 'required' in p.inner_text('.form-msg').lower() or '必填' in p.inner_text('.form-msg'), p.inner_text('.form-msg'))
    p.fill('[data-lead-form] [name=name]', 'Li Wei'); p.fill('[data-lead-form] [name=email]', 'li@example.com')
    p.fill('[data-lead-form] [name=route]', 'Shenzhen -> Los Angeles'); p.fill('[data-lead-form] [name=cargo]', 'LED lamps')
    p.click('[data-lead-form] [name=consent]')
    p.click('[data-lead-form] button[type=submit]')
    p.wait_for_selector('[data-lead-form] .form-msg.ok')
    check('quote form: submit succeeds', True)
    p.close()
    s, j = api('/api/admin/leads', headers={'authorization': 'Bearer dev-admin'})
    cats = sorted(l['category'] for l in j['leads'])
    check('leads stored with category and consent record', cats == ['freight-forwarder', 'pro-waitlist'] and all(l['consent']['version'] for l in j['leads']), cats)
    fl = [l for l in j['leads'] if l['category'] == 'freight-forwarder'][0]
    check('lead keeps its source tool', fl['src'] == 'volumetric-weight-calculator', fl.get('src'))


@scenario
def pro_flow(browser, errors):
    ctx = browser.new_context(user_agent=UA, viewport={'width': 1280, 'height': 900}, accept_downloads=True)
    p = newpage(ctx, errors)
    # unknown email: no mail, same message
    p.goto(BASE + '/account/', wait_until='networkidle')
    p.fill('#login-form [name=email]', 'stranger@example.com'); p.click('#login-form button')
    p.wait_for_selector('#login-form .form-msg.ok')
    s, box = api('/__dev/outbox')
    check('login: unknown email gets the same answer but no mail', not any('stranger@' in ','.join(m['to']) for m in box))
    # Paddle webhook (signed) activates the subscription
    s, j = api('/__dev/subscribe', 'POST', {'email': 'pro@example.com', 'status': 'active'})
    check('webhook: signed subscription.activated accepted', s == 200 and j.get('status') == 'active', (s, j))
    s, box = api('/__dev/outbox')
    check('webhook: welcome mail with sign-in link', any('pro@example.com' in ','.join(m['to']) and 'Pro is active' in m['subject'] for m in box))
    # request a link from the page and follow it
    p.fill('#login-form [name=email]', 'pro@example.com'); p.click('#login-form button')
    p.wait_for_selector('#login-form .form-msg.ok')
    time.sleep(0.4)
    s, box = api('/__dev/outbox')
    mail = [m for m in box if 'pro@example.com' in ','.join(m['to']) and 'sign-in link' in m['subject'].lower()][-1]
    link = re.search(r'(http://\S+/account/\?t=\S+)', mail['text']).group(1)
    p.goto(link, wait_until='networkidle')
    p.wait_for_selector('#acct-main :text("Pro")')
    check('magic link signs in; URL token is removed from the address bar', 't=' not in p.url, p.url)
    check('account shows plan Pro and email', 'pro@example.com' in p.inner_text('#acct-main'))
    ctx2 = browser.new_context(user_agent=UA)   # separate storage: a fresh browser opening the same link
    p2 = newpage(ctx2, errors)
    p2.goto(link, wait_until='networkidle')
    p2.wait_for_selector('#login-form .form-msg.err', timeout=5000)
    check('magic link cannot be reused', True)
    ctx2.close()
    # API key + API call
    p.click('#rotate'); p.wait_for_function('document.getElementById("key-out").textContent.startsWith("cbt_live_")')
    key = p.inner_text('#key-out')
    s, j = api('/api/v1/volumetric?l=40&w=30&h=20&actual=3.2', headers={'authorization': 'Bearer ' + key})
    check('API key from account page works', s == 200 and j['chargeableKg'] == 4.8, (s, j))
    s, j = api('/api/v1/tariff/us?hts=8517130000&origin=CN&value=1000', headers={'authorization': 'Bearer ' + key})
    check('API: US tariff end to end through mocked HTS', s == 200 and j['totalPct'] == 37.5 and j['estimatedDuty'] == 375, (s, j))
    # watchlist persists
    p.fill('#watch-in', '8517.13'); p.click('#watch-add')
    p.wait_for_selector('#watch-list :text("8517.13")')
    p.reload(wait_until='networkidle')
    p.wait_for_selector('#watch-list :text("8517.13")')
    check('watchlist saved and restored after reload', True)
    # portal
    with ctx.expect_page() as pop:
        p.click('#portal')
    pp = pop.value
    pp.wait_for_load_state()
    check('billing portal opens the Paddle-provided URL', 'portal' in pp.url, pp.url)
    pp.close()
    # header shows Pro
    check('header account button marked Pro', 'pro' in (p.get_attribute('#nav-account', 'class') or ''))

    # Pro limits lifted
    p.goto(BASE + '/tools/image-resizer-for-marketplaces/', wait_until='networkidle')
    p.set_input_files('#img-file', PHOTOS)
    p.wait_for_function('document.querySelectorAll(".img-row").length >= 6', timeout=20000)
    check('Pro: 6 images processed without paywall', p.locator('.paywall').count() == 0 and p.locator('.img-row').count() == 6)
    p.wait_for_function('[...document.querySelectorAll(".img-row .img-detail")].every(e => e.textContent.trim() && !/^(Working|处理中)/.test(e.textContent.trim()))', timeout=40000)
    with p.expect_download(timeout=30000) as dl:
        p.click('#img-zip')
    check('Pro: ZIP download works', dl.value.suggested_filename.endswith('.zip'), dl.value.suggested_filename)

    p.goto(BASE + '/tools/us-tariff-calculator/', wait_until='networkidle')
    p.fill('#us-hs', '8517.13.00.00'); p.click('#us-go'); p.wait_for_selector('#us-out .results')
    with p.expect_download() as dl:
        p.click('.exp-bar .btn')
    path = dl.value.path()
    csv = open(path, encoding='utf-8-sig').read()
    check('Pro: result CSV export downloads with data', dl.value.suggested_filename.endswith('.csv') and '37.5' in csv, csv[:120])

    p.goto(BASE + '/pro/bulk/', wait_until='networkidle')
    p.click('#b-sample'); p.click('#b-run')
    p.wait_for_selector('#b-out tbody tr')
    check('Pro: bulk shows all 6 sample rows', p.locator('#b-out tbody tr').count() == 6, p.locator('#b-out tbody tr').count())
    with p.expect_download() as dl:
        p.click('#b-exp')
    csv = open(dl.value.path(), encoding='utf-8-sig').read()
    check('Pro: bulk CSV export', dl.value.suggested_filename.endswith('.csv') and 'A-100' in csv, csv[:160])
    p.click('.tabs button:nth-child(3)')
    p.click('#b-sample'); p.click('#b-run')
    p.wait_for_selector('#b-out tbody tr')
    check('bulk HS tab matches sample products', p.locator('#b-out tbody tr').count() == 7)
    check('Pro: pro-strip hidden', all(not e.is_visible() for e in p.locator('[data-pro-strip]').all()))

    # sign out returns to the free plan
    p.goto(BASE + '/account/', wait_until='networkidle')
    p.click('#signout')
    p.wait_for_selector('#login-form', state='visible')
    check('sign out returns to the sign-in form', True)
    ctx.close()


@scenario
def analytics(browser, errors):
    ctx = browser.new_context(user_agent=UA)
    p = newpage(ctx, errors)
    s, before = api('/__dev/events')
    n0 = len(before)
    p.goto(BASE + '/tools/hs-code-lookup/', wait_until='networkidle', )
    p.wait_for_timeout(500)
    s, ev = api('/__dev/events')
    new = ev[n0:]
    names = [e['indexes'][0] for e in new]
    check('first visit records pageview + new_visitor', 'pageview' in names and 'new_visitor' in names, names)
    pv = [e for e in new if e['indexes'][0] == 'pageview'][0]
    check('pageview carries page, type and direct referrer, no IP/UA', pv['blobs'][2] == '/tools/hs-code-lookup/' and pv['blobs'][3] == 'tool' and pv['blobs'][5] == 'direct' and not any('Mozilla' in b or '127.0.0.1' in b for b in pv['blobs']), pv['blobs'])
    p.fill('#hs-q', 'yoga mat'); p.click('#hs-go'); p.wait_for_timeout(500)
    s, ev = api('/__dev/events')
    check('tool_use recorded once per visit', sum(1 for e in ev[n0:] if e['indexes'][0] == 'tool_use') == 1, [e['indexes'][0] for e in ev[n0:]])
    # simulate coming back 3 hours later after 10 days
    p.evaluate('() => { localStorage.setItem("cbt_first", String(Date.now() - 10*864e5)); localStorage.setItem("cbt_last", String(Date.now() - 3*3600e3)); localStorage.setItem("cbt_visits", "1"); }')
    n1 = len(api('/__dev/events')[1])
    p.goto(BASE + '/', wait_until='networkidle'); p.wait_for_timeout(500)
    s, ev = api('/__dev/events')
    rv = [e for e in ev[n1:] if e['indexes'][0] == 'return_visit']
    check('return visit carries a referrer class', len(rv) == 1 and rv[0]['blobs'][5] in ('direct', 'internal'), rv and rv[0]['blobs'][5])
    check('return visit recorded with buckets (visit 2, 7-29 days since first, <1 day since last)', len(rv) == 1 and rv[0]['blobs'][11] == '2' and rv[0]['blobs'][12] == '7-29' and rv[0]['blobs'][13] == '0', rv and rv[0]['blobs'])
    p.goto(BASE + '/pricing/', wait_until='networkidle'); p.wait_for_timeout(300)
    s, ev = api('/__dev/events')
    check('navigating within 30 minutes is not a new visit', sum(1 for e in ev[n1:] if e['indexes'][0] in ('return_visit', 'new_visitor')) == 1)
    p.click('#buy'); p.wait_for_timeout(300)
    s, ev = api('/__dev/events')
    check('pro_cta recorded with plan', any(e['indexes'][0] == 'pro_cta' and e['blobs'][14] == 'monthly' for e in ev), None)
    ctx.close()
    # bots are not counted
    bctx = browser.new_context(user_agent='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    bp = newpage(bctx, errors)
    n2 = len(api('/__dev/events')[1])
    bp.goto(BASE + '/', wait_until='networkidle'); bp.wait_for_timeout(300)
    check('crawler visits are not counted', len(api('/__dev/events')[1]) == n2)
    bctx.close()


@scenario
def misc(ctx, errors):
    p = newpage(ctx, errors)
    r = p.goto(BASE + '/definitely-missing/', wait_until='networkidle')
    check('unknown URL returns 404 with the site 404 page', r.status == 404 and 'Page not found' in p.inner_text('h1'), r.status)
    r = p.goto(BASE + '/account/', wait_until='networkidle')
    check('account page is noindex', 'noindex' in (p.get_attribute('meta[name=robots]', 'content') or ''))
    p.goto(BASE + '/tools/unit-converter/', wait_until='networkidle')
    check('tool pages have exactly one canonical', p.locator('link[rel=canonical]').count() == 1)
    ld = p.eval_on_selector_all('script[type="application/ld+json"]', 'els => els.map(e => JSON.parse(e.textContent)["@type"])')
    check('tool page JSON-LD: WebApplication + FAQPage + BreadcrumbList', {'WebApplication', 'FAQPage', 'BreadcrumbList'} <= set(ld), ld)
    p.goto(BASE + '/affiliate-disclosure/', wait_until='networkidle')
    check('affiliate disclosure page exists', 'commission' in p.inner_text('main').lower() or 'referral' in p.inner_text('main').lower())
    p.close()


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    errors = []
    ctx = browser.new_context(user_agent=UA, viewport={'width': 1280, 'height': 900})
    tools_work(ctx, errors)
    chinese_pages(ctx, errors)
    free_limits(ctx, errors)
    leads_and_waitlist(ctx, errors)
    misc(ctx, errors)
    ctx.close()
    pro_flow(browser, errors)
    analytics(browser, errors)
    real_errors = [e for e in errors if 'favicon' not in e and 'Failed to load resource' not in e]
    check('no uncaught JS errors across all scenarios', not real_errors, real_errors[:5])
    browser.close()

if srv:
    srv.terminate()
fails = [r for r in results if not r[1]]
print('\n%d checks, %d failed' % (len(results), len(fails)))
sys.exit(1 if fails else 0)
