# Visits representative pages of every type in a real browser and reports console errors / failed requests / empty tool mounts.
import sys, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8791'
TOOLS = ['volumetric-weight-calculator','unit-converter','currency-converter','time-zone-converter','country-codes','hs-code-lookup','us-tariff-calculator','eu-import-duty-vat-calculator','postal-code-lookup','image-resizer-for-marketplaces']
PAGES = ['/', '/tools/', '/image-size/', '/image-size/amazon/', '/hs-code/', '/hs-code/chapter-85/', '/guides/', '/guides/volumetric-weight-divisors/', '/policy-updates/', '/pricing/', '/account/', '/pro/bulk/', '/docs/api/', '/get-quotes/', '/get-quotes/freight-forwarders/', '/privacy/', '/terms/', '/refund/', '/affiliate-disclosure/', '/about/', '/contact/']
urls = [p for p in PAGES] + ['/tools/%s/' % t for t in TOOLS]
urls += ['/zh' + (p if p != '/' else '/') for p in PAGES[:3]] + ['/zh/tools/%s/' % t for t in TOOLS]

problems = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    for u in urls:
        page = ctx.new_page()
        errs = []
        page.on('console', lambda m, errs=errs: errs.append('console:' + m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e, errs=errs: errs.append('pageerror:' + str(e)))
        page.on('requestfailed', lambda r, errs=errs: errs.append('reqfailed:' + r.url))
        page.on('response', lambda r, errs=errs: errs.append('http%d:%s' % (r.status, r.url)) if r.status >= 400 and '/api/e' not in r.url else None)
        resp = page.goto(BASE + u, wait_until='networkidle')
        if resp.status != 200: errs.append('status %d' % resp.status)
        if '/tools/' in u and u.rstrip('/').split('/')[-1] in TOOLS:
            txt = page.eval_on_selector('#tool-mount', 'e => e.innerText.trim().length')
            if txt < 40: errs.append('tool mount empty (%s chars)' % txt)
        h1 = page.eval_on_selector_all('h1', 'els => els.length')
        if h1 != 1: errs.append('h1 count %d' % h1)
        if errs: problems.append((u, errs))
        page.close()
    b.close()
print(json.dumps(problems, indent=1, ensure_ascii=False) if problems else 'ALL %d PAGES OK' % len(urls))
