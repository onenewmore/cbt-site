// Shared UI strings + legal/boilerplate pages (EN primary, ZH secondary).
export const UI = {
  en: {
    langName: 'English', otherLangName: '中文',
    nav: { tools: 'Tools', imageSize: 'Image sizes', hs: 'HS codes', guides: 'Guides', policy: 'Policy updates', pricing: 'Pricing', quotes: 'Get quotes', account: 'Sign in', accountPro: 'Account' },
    home: {
      title: 'Cross-border Trade Toolkit: Free Calculators for Sellers & Importers',
      desc: 'Free tools for cross-border e-commerce: volumetric weight, currency, HS codes, US & EU duty, postal codes, time zones and marketplace image sizes.',
      h1: 'Free tools for cross-border sellers and importers',
      lead: 'Calculate shipping weight, look up HS codes and duties, convert currencies and prepare marketplace images. No sign-up needed.',
      toolsH: 'All tools', guidesH: 'Guides', imageH: 'Image size requirements by marketplace',
      proH: 'Need more? Pro adds bulk, export, API and policy alerts',
      proLead: 'Run hundreds of SKUs at once, export results, call our API and get an email when tariff or platform rules change.',
      proCta: 'See Pro', extH: 'Also available as a Chrome extension', extLead: 'Keep the same tools one click away in your browser toolbar.', extCta: 'Get the extension',
      trust: ['No sign-up for free tools', 'Images are processed in your browser', 'Reference data with as-of dates'],
      quotesH: 'Need a partner? Get quotes', quotesLead: 'Freight forwarders, overseas warehouses, VAT filing, customs brokers and payment tools.',
    },
    common: {
      tool: 'Tool', howto: 'Guide', faq: 'Frequently asked questions', related: 'Related tools', updated: 'Updated', openTool: 'Open the tool',
      asOf: 'Reference data as of', disclaimerShort: 'For reference only. Not customs, legal, tax or financial advice. Not affiliated with any marketplace, carrier or customs authority.',
      noscript: 'This tool needs JavaScript. Enable it to use the calculator.',
      getExt: 'Chrome extension', skip: 'Skip to content', home: 'Home', toc: 'On this page',
      next: 'Next step', sponsored: 'Sponsored', adNote: 'We may earn a commission or referral fee. See our affiliate disclosure.',
      proBadge: 'Pro', proHint: 'Pro feature', unlock: 'Unlock with Pro',
    },
    footer: { tools: 'Tools', resources: 'Resources', company: 'Company', about: 'About', contact: 'Contact', privacy: 'Privacy', terms: 'Terms', refund: 'Refund policy', affiliate: 'Affiliate disclosure', api: 'API docs', rights: 'All rights reserved.' },
    imageSize: {
      hubTitle: 'Marketplace Image Size Requirements: Amazon, Temu, AliExpress',
      hubDesc: 'Reference image sizes and file-size limits for Amazon, Walmart, eBay, Temu, AliExpress, Shopee, TikTok Shop, Lazada and Shopify, plus a free resizer.',
      hubH1: 'Image Size Requirements by Marketplace',
      hubLead: 'Reference values collected from public seller guidance. Rules change; confirm in your seller dashboard.',
      pageTitle: (p) => `${p} Product Image Size Requirements (Pixels, File Size)`,
      pageDesc: (p) => `${p} product image size and file-size reference, plus a free resizer that outputs the exact pixel size under the limit.`,
      pageH1: (p) => `${p} Image Size Requirements`,
      cols: ['Preset', 'Output size', 'File size cap', 'Min. source (long side)', 'Notes'],
      useTool: 'Resize for this marketplace', useToolLead: 'Open the resizer, tick the preset and drop your photos. Processing happens in your browser.',
      caveatH: 'About these values', caveat: 'These are reference values gathered from public seller guidance and seller-community guides (as of {asOf}). Marketplaces change requirements without notice and may vary by category. Always confirm in the official seller documentation or dashboard.',
      otherH: 'Other marketplaces',
    },
    hs: {
      hubTitle: 'HS Code List by Chapter: Common Cross-border Products (HS 2022)',
      hubDesc: 'Browse HS codes by chapter with English and Chinese product names and classification notes. Reference list for common cross-border products.',
      hubH1: 'HS Codes by Chapter', hubLead: 'Reference list of common cross-border products by HS chapter. Use the lookup tool to search by name.',
      chapTitle: (n, name) => `HS Chapter ${n}: ${name}`,
      chapDesc: (n, name) => `HS codes in chapter ${n} (${name}): common products with 6-digit codes, English and Chinese names and classification notes.`,
      chapH1: (n, name) => `HS Chapter ${n}: ${name}`,
      otherH: 'Other common products', otherLead: 'Chapters with only a few reference entries are listed here instead of getting a page of their own.',
      cols: ['HS code', 'Product', 'Chinese name', 'Notes'], colsZh: ['HS 编码', '商品', '英文名', '说明'],
      lookupTool: 'Open the HS code lookup', lookup: 'Look up this code', us: 'US tariff', eu: 'EU TARIC', none: 'No built-in reference entries for this chapter yet. Use the lookup tool to search the US HTS online.',
      caveat: 'Reference only (HS 2022 subheadings). Classification depends on material, function and composition, and customs makes the final decision.',
    },
    guides: { hubTitle: 'Cross-border Trade Guides: Shipping Weight, HS Codes, Landed Cost', hubDesc: 'Practical guides for cross-border sellers: volumetric weight, HS codes and landed cost with worked examples.', hubH1: 'Guides', hubLead: 'Practical, example-driven guides to go with the tools.', read: 'Read the guide' },
    policy: {
      title: 'Trade Policy Updates: US Tariffs, EU Duties & Marketplace Image Rules',
      desc: 'What we track and when it was last reviewed: US Section 301 and IEEPA changes, the EU €3 low-value duty, and marketplace image preset reviews.',
      h1: 'Trade Policy Updates', lead: 'A short log of the rules our tools depend on. Pro members can get an email when something changes.',
      trackedH: 'What we track', col: ['Area', 'Used by', 'Last reviewed'], alertsCta: 'Get email alerts with Pro', sourceLabel: 'Source', disclaimer: 'Summaries are for orientation only; read the official notices before acting.',
    },
    pricing: {
      title: 'Pricing: Free & Pro Plans for Cross-border Sellers',
      desc: 'Free tools for single look-ups. Pro adds bulk CSV, exports, API access and policy alerts for teams that process many SKUs.',
      h1: 'Pricing', lead: 'Everything for single look-ups stays free. Pro is for when you process many SKUs or want updates pushed to you.',
      free: 'Free', pro: 'Pro', monthly: 'Monthly', annual: 'Annual', pass: '1-year pass', passNote: 'one-time payment, no auto-renewal; WeChat Pay / Alipay available', perMonth: '/ month', perYear: '/ year', save: 'Save {pct}%',
      freeList: ['All single-item calculators and look-ups', 'Image resizer: {imgFiles} images × {imgPresets} presets per run', 'Bulk CSV preview: first {rows} rows', 'Public policy updates page'],
      proList: ['Bulk CSV: volumetric weight, currency and HS matching (up to {rows} rows)', 'Export results to CSV', 'Unlimited image batches and ZIP download', 'API access ({calls} calls / month)', 'Policy alerts by email + watchlist of up to {watch} HTS codes'],
      cta: 'Subscribe', ctaWait: 'Join the Pro waitlist', ctaCurrent: 'You are on Pro', taxNote: 'Prices are exclusive of VAT/sales tax where applicable. Payments are handled by Paddle, our merchant of record, which calculates and collects the tax for you.',
      faqH: 'Pricing FAQ',
      faq: [
        { q: 'Who processes the payment?', a: 'Paddle is our merchant of record. It handles checkout, invoices, VAT and sales tax. We never see your card details.' },
        { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your account; Pro stays active until the end of the paid period. See the refund policy for refunds.' },
        { q: 'Do I need Pro for the Chrome extension?', a: 'No. The extension and the single-item web tools stay free.' },
        { q: 'Is the API included?', a: 'Yes, Pro includes an API key with a monthly call allowance. See the API docs.' },
      ],
      waitlistH: 'Pro is opening soon', waitlistLead: 'Leave your email and we will tell you when Pro opens. No spam.',
    },
    account: {
      title: 'Account', h1: 'Your account', signinLead: 'Enter the email you used at checkout. We will send you a sign-in link.', email: 'Email', send: 'Send sign-in link', sent: 'If that email has a Pro plan, a sign-in link is on its way. It expires in 15 minutes.',
      signedAs: 'Signed in as', plan: 'Plan', status: 'Status', renews: 'Current period ends', signout: 'Sign out', free: 'No active Pro plan', manage: 'Manage billing',
      apiH: 'API key', apiLead: 'Use this key as a Bearer token. Rotating invalidates the old key.', rotate: 'Generate new key', keyOnce: 'Copy it now: it is shown only once.',
      watchH: 'Policy alerts', watchLead: 'Get an email when the duty rate of a watched US HTS code changes, and a digest when we publish a policy update.', watchPh: 'HTS code, e.g. 8518.30.20.00', watchAdd: 'Add', watchDigest: 'Email me policy updates', watchSave: 'Saved',
      checkoutOk: 'Thanks! Your payment is processing. Sign in with the email you used at checkout.', invalidLink: 'This sign-in link is invalid or expired. Request a new one.',
    },
    bulk: {
      title: 'Bulk Calculator: Volumetric Weight, Currency & HS Matching (CSV)',
      desc: 'Process hundreds of SKUs at once: bulk volumetric weight, currency conversion and HS code matching from pasted CSV, with CSV export for Pro.',
      h1: 'Bulk Calculator', lead: 'Paste CSV or upload a file. Calculations run in your browser; nothing is uploaded.',
      tabs: { volume: 'Volumetric weight', fx: 'Currency', hs: 'HS matching' },
      run: 'Calculate', upload: 'Upload CSV', sample: 'Load sample', export: 'Download CSV', rows: 'rows', previewOnly: 'Free preview: first {rows} rows. Pro processes up to {max} rows and exports CSV.', unlock: 'Unlock with Pro',
      volHelp: 'Columns: sku, length, width, height, weight, qty. Units follow the selectors below.', fxHelp: 'Columns: amount, from, to (ISO currency codes). Rates are fetched live.', hsHelp: 'One product name per line (English or Chinese). The best HS6 reference is matched from the built-in list.',
      divisor: 'Divisor', unit: 'Unit',
    },
    quotes: {
      hubTitle: 'Get Quotes: Freight, Warehousing, VAT Filing, Customs, Payments',
      hubDesc: 'Request quotes for freight forwarding, overseas warehousing, VAT filing, customs brokerage and cross-border payment tools.',
      hubH1: 'Get Quotes for Cross-border Services', hubLead: 'Tell us what you need. We share your request only with matched service providers, and only with your consent.',
      catTitle: (n) => `${n}: Get Quotes`, catDesc: (n) => `Request quotes from ${n.toLowerCase()} for your cross-border shipments.`,
      form: { name: 'Your name', email: 'Work email', company: 'Company (optional)', route: 'Origin → destination', cargo: 'What are you shipping / selling?', volume: 'Monthly volume', details: 'Anything else we should know?', consent: 'I agree that {site} may share this request and my contact details with matched service providers, who may contact me about it. See the privacy policy.', submit: 'Request quotes', thanks: 'Thanks! We have your request.', error: 'Something went wrong. Please try again.', required: 'Please fill in the required fields and accept the consent.' },
      partnersH: 'Recommended services', partnersNote: 'Partner links may earn us a commission at no extra cost to you.',
      toolBoxH: 'Next step', toolBoxLead: 'Using this tool for a real shipment? Get help from a vetted provider.',
    },
    docs: {
      title: 'API Documentation: HS Search, Tariff, Volumetric Weight, FX', desc: 'REST API for volumetric weight, currency conversion, HS code search, US tariff estimates and EU landed cost. Pro plan, Bearer token.',
      h1: 'API Documentation', lead: 'JSON over HTTPS. Authenticate with your Pro API key.',
    },
    legal: { updated: 'Last updated' },
  },

  zh: {
    langName: '中文', otherLangName: 'English',
    nav: { tools: '工具', imageSize: '图片尺寸', hs: 'HS 编码', guides: '指南', policy: '政策更新', pricing: '定价', quotes: '获取报价', account: '登录', accountPro: '账户' },
    home: {
      title: '跨境电商工具箱：卖家与进口商的免费计算器',
      desc: '跨境电商免费工具：体积重、汇率、HS 编码、美欧关税、邮编、时区和平台图片尺寸。',
      h1: '跨境卖家和进口商的免费工具',
      lead: '计算运输重量、查 HS 编码和关税、换算汇率、处理平台图片。无需注册。',
      toolsH: '全部工具', guidesH: '指南', imageH: '各平台图片尺寸要求',
      proH: '需要更多？Pro 提供批量、导出、API 和政策提醒',
      proLead: '一次处理上百个 SKU、导出结果、调用 API，并在关税或平台规则变化时收到邮件。',
      proCta: '了解 Pro', extH: '也有 Chrome 扩展', extLead: '把同样的工具放在浏览器工具栏，一键打开。', extCta: '获取扩展',
      trust: ['免费工具无需注册', '图片在浏览器本机处理', '参考数据标注更新日期'],
      quotesH: '需要合作伙伴？获取报价', quotesLead: '货代、海外仓、VAT 申报、报关行和收款工具。',
    },
    common: {
      tool: '工具', howto: '指南', faq: '常见问题', related: '相关工具', updated: '更新于', openTool: '打开工具',
      asOf: '参考数据截至', disclaimerShort: '仅供参考，不构成报关、法律、税务或财务意见。与任何平台、承运商或海关机构无官方关联。',
      noscript: '此工具需要 JavaScript，请启用后使用。',
      getExt: 'Chrome 扩展', skip: '跳到正文', home: '首页', toc: '本页内容',
      next: '下一步', sponsored: '赞助', adNote: '我们可能获得佣金或推荐费，详见联盟披露。',
      proBadge: 'Pro', proHint: 'Pro 功能', unlock: '订阅 Pro 解锁',
    },
    footer: { tools: '工具', resources: '资源', company: '关于', about: '关于我们', contact: '联系我们', privacy: '隐私政策', terms: '服务条款', refund: '退款政策', affiliate: '联盟披露', api: 'API 文档', rights: '保留所有权利。' },
    imageSize: {
      hubTitle: '各平台商品图片尺寸要求（亚马逊、Temu、速卖通、Shopee 等）',
      hubDesc: '亚马逊、沃尔玛、eBay、Temu、速卖通、Shopee、TikTok Shop、Lazada、Shopify 的图片尺寸与体积上限参考，并附免费尺寸调整工具。',
      hubH1: '各平台商品图片尺寸要求',
      hubLead: '根据公开卖家指南整理的参考值。规则会变化，请以卖家后台为准。',
      pageTitle: (p) => `${p} 商品图片尺寸要求（像素、体积上限）`,
      pageDesc: (p) => `${p} 商品图片尺寸与体积上限参考，并附免费工具，一键输出符合上限的精确像素尺寸。`,
      pageH1: (p) => `${p} 图片尺寸要求`,
      cols: ['预设', '输出尺寸', '体积上限', '原图最小（长边）', '说明'],
      useTool: '按此平台调整图片', useToolLead: '打开工具，勾选预设，放入图片。处理在浏览器本机完成。',
      caveatH: '关于这些数值', caveat: '以下是根据公开卖家指南和卖家社区资料整理的参考值（截至 {asOf}）。平台会不经通知调整要求，不同类目也可能不同，请以官方文档或卖家后台为准。',
      otherH: '其他平台',
    },
    hs: {
      hubTitle: 'HS 编码按章节列表：常见跨境商品（HS 2022）',
      hubDesc: '按章节浏览 HS 编码，含中英文品名和归类提示。常见跨境商品参考列表。',
      hubH1: '按章节浏览 HS 编码', hubLead: '按 HS 章节列出的常见跨境商品参考，可用查询工具按名称搜索。',
      chapTitle: (n, name) => `HS 第 ${n} 章：${name} | HS 编码列表`,
      chapDesc: (n, name) => `HS 第 ${n} 章（${name}）的常见商品 6 位编码、中英文品名和归类提示。`,
      chapH1: (n, name) => `HS 第 ${n} 章：${name}`,
      otherH: '其他常见商品', otherLead: '参考条目较少的章节没有单独页面，统一列在这里。',
      cols: ['HS 编码', '商品', '英文名', '说明'],
      lookupTool: '打开 HS 编码查询工具', lookup: '查询该编码', us: '美国关税', eu: '欧盟 TARIC', none: '本章暂无内置参考条目，请使用查询工具在线检索美国 HTS。',
      caveat: '仅供参考（HS 2022 子目）。归类取决于材质、功能和成分，最终由海关认定。',
    },
    guides: { hubTitle: '跨境贸易指南：运输重量、HS 编码、到岸成本', hubDesc: '面向跨境卖家的实用指南：体积重、HS 编码和到岸成本，附示例。', hubH1: '指南', hubLead: '配合工具使用的实用、带示例的指南。', read: '阅读指南' },
    policy: {
      title: '贸易政策更新：美国关税、欧盟关税与平台图片规则',
      desc: '我们跟踪的规则及最近复核日期：美国 Section 301 与 IEEPA 变化、欧盟 €3 低价值关税、平台图片预设复核。',
      h1: '贸易政策更新', lead: '我们的工具所依赖规则的简要日志。Pro 会员可在规则变化时收到邮件。',
      trackedH: '我们跟踪的内容', col: ['领域', '用于', '最近复核'], alertsCta: '订阅 Pro 获取邮件提醒', sourceLabel: '来源', disclaimer: '摘要仅供了解方向，行动前请阅读官方公告。',
    },
    pricing: {
      title: '定价：面向跨境卖家的免费版与 Pro 版',
      desc: '单次查询的工具免费。Pro 增加批量 CSV、导出、API 和政策提醒，适合处理大量 SKU 的团队。',
      h1: '定价', lead: '单次查询类功能一直免费。当你要处理很多 SKU 或希望更新主动推送给你时，选择 Pro。',
      free: '免费版', pro: 'Pro', monthly: '月付', annual: '年付', pass: '一年通行证', passNote: '一次性付款，不自动续费；支持微信支付 / 支付宝', perMonth: '/ 月', perYear: '/ 年', save: '省 {pct}%',
      freeList: ['全部单个商品计算器与查询', '图片工具：每次 {imgFiles} 张图 × {imgPresets} 个预设', '批量 CSV 预览：前 {rows} 行', '公开的政策更新页面'],
      proList: ['批量 CSV：体积重、汇率、HS 匹配（最多 {rows} 行）', '结果导出 CSV', '图片批量不限量 + ZIP 下载', 'API 访问（每月 {calls} 次调用）', '邮件政策提醒 + 最多 {watch} 个 HTS 编码监控'],
      cta: '立即订阅', ctaWait: '加入 Pro 候补名单', ctaCurrent: '你已是 Pro', taxNote: '价格不含适用的 VAT/销售税。支付由我们的 Merchant of Record Paddle 处理，由其计算并代收税款。',
      faqH: '定价常见问题',
      faq: [
        { q: '谁来处理付款？', a: 'Paddle 是我们的 Merchant of Record，负责结账、发票、VAT 和销售税。我们不会看到你的银行卡信息。' },
        { q: '可以随时取消吗？', a: '可以。在账户中取消，Pro 在已付费周期结束前保持有效。退款见退款政策。' },
        { q: 'Chrome 扩展需要 Pro 吗？', a: '不需要。扩展和网页上的单个商品工具保持免费。' },
        { q: '包含 API 吗？', a: '包含。Pro 带 API Key 和每月调用额度，见 API 文档。' },
      ],
      waitlistH: 'Pro 即将开放', waitlistLead: '留下邮箱，开放时第一时间通知你。不发垃圾邮件。',
    },
    account: {
      title: '账户', h1: '你的账户', signinLead: '输入结账时使用的邮箱，我们会发送登录链接。', email: '邮箱', send: '发送登录链接', sent: '如果该邮箱有 Pro 订阅，登录链接已在路上，15 分钟内有效。',
      signedAs: '当前登录', plan: '套餐', status: '状态', renews: '当前周期结束', signout: '退出登录', free: '没有有效的 Pro 订阅', manage: '管理账单',
      apiH: 'API Key', apiLead: '作为 Bearer token 使用。重新生成会使旧 Key 失效。', rotate: '生成新 Key', keyOnce: '请立即复制：只显示一次。',
      watchH: '政策提醒', watchLead: '被监控的美国 HTS 编码税率变化时发邮件；我们发布政策更新时发送摘要。', watchPh: 'HTS 编码，如 8518.30.20.00', watchAdd: '添加', watchDigest: '向我发送政策更新邮件', watchSave: '已保存',
      checkoutOk: '谢谢！付款处理中，请用结账时的邮箱登录。', invalidLink: '登录链接无效或已过期，请重新获取。',
    },
    bulk: {
      title: '批量计算器：体积重、汇率与 HS 匹配（CSV）',
      desc: '一次处理上百个 SKU：批量体积重、汇率换算和 HS 编码匹配，粘贴 CSV 即可，Pro 可导出 CSV。',
      h1: '批量计算器', lead: '粘贴 CSV 或上传文件。计算在浏览器里完成，不会上传。',
      tabs: { volume: '体积重', fx: '汇率', hs: 'HS 匹配' },
      run: '计算', upload: '上传 CSV', sample: '载入示例', export: '下载 CSV', rows: '行', previewOnly: '免费预览：前 {rows} 行。Pro 最多处理 {max} 行并可导出 CSV。', unlock: '订阅 Pro 解锁',
      volHelp: '列：sku, length, width, height, weight, qty。单位以下方选择为准。', fxHelp: '列：amount, from, to（ISO 币种代码）。汇率实时获取。', hsHelp: '每行一个商品名（中英文均可），从内置库匹配最接近的 HS6 参考编码。',
      divisor: '系数', unit: '单位',
    },
    quotes: {
      hubTitle: '获取报价：货代、海外仓、VAT 申报、报关行与收款工具',
      hubDesc: '提交需求，获取货代、海外仓、VAT 申报、报关行和跨境收款工具的报价，信息仅用于匹配服务商。',
      hubH1: '获取跨境服务报价', hubLead: '告诉我们你的需求。仅在你同意的前提下，把请求分享给匹配的服务商。',
      catTitle: (n) => `${n}：获取报价`, catDesc: (n) => `向${n}提交你的跨境业务需求，获取报价；信息仅在你同意后提供给匹配的服务商。`,
      form: { name: '你的姓名', email: '工作邮箱', company: '公司（选填）', route: '起运地 → 目的地', cargo: '你在运输 / 销售什么？', volume: '月发货量', details: '还有什么需要补充的？', consent: '我同意 {site} 把此请求和我的联系方式分享给匹配的服务商，服务商可就此联系我。详见隐私政策。', submit: '提交报价请求', thanks: '谢谢！我们已收到你的请求。', error: '出错了，请重试。', required: '请填写必填项并勾选同意。' },
      partnersH: '推荐服务', partnersNote: '通过合作伙伴链接，我们可能获得佣金，不会增加你的费用。',
      toolBoxH: '下一步', toolBoxLead: '正在为真实货物使用这个工具？让经过筛选的服务商帮你。',
    },
    docs: {
      title: 'API 文档：HS 搜索、关税、体积重、汇率', desc: '体积重、汇率、HS 编码搜索、美国关税估算和欧盟到岸成本的 REST API。Pro 套餐，Bearer 认证。',
      h1: 'API 文档', lead: 'HTTPS 上的 JSON。使用你的 Pro API Key 认证。',
    },
    legal: { updated: '最后更新' },
  },
};

// ---- legal & boilerplate pages (placeholders in {{…}} must be replaced before launch) ----
export const LEGAL = {
  privacy: {
    en: {
      title: 'Privacy Policy', desc: 'How this website, its tools, accounts, payments and quote requests handle personal data.',
      body: `
<p><b>In short:</b> the free tools run in your browser. We use privacy-friendly analytics without advertising cookies. We store personal data only when you sign in to Pro, request quotes or join the waitlist.</p>
<h2>Who we are</h2>
<p>{{COMPANY_NAME}} operates this website (the data controller). Contact: {{CONTACT_EMAIL}}.</p>
<h2>What we collect and why</h2>
<table class="tbl"><thead><tr><th>Data</th><th>When</th><th>Purpose / legal basis</th></tr></thead><tbody>
<tr><td>Tool inputs (dimensions, codes, amounts, images)</td><td>Using the tools</td><td>Calculated in your browser. Images never leave your device. Some look-ups (tariff, postal code, FX) are forwarded through our proxy to public data providers; we do not store the content of these requests.</td></tr>
<tr><td>Anonymous usage events and page views (page, referring site, language, device type, country, visit-count ranges)</td><td>Browsing</td><td>Understand which pages and tools are used and how often visitors return (legitimate interest). No advertising cookies, no cross-site tracking, no IP address or user-agent string stored by our event endpoint. Country is derived by the edge network and stored only as a country code.</td></tr>
<tr><td>Return-visit counter</td><td>Browsing</td><td>A small counter stored in your browser (localStorage) lets us send an anonymous "returning visitor" event. You can clear it in your browser settings.</td></tr>
<tr><td>Email, plan status, API key hash, watchlist</td><td>Pro account</td><td>Provide the subscription, sign-in links, API and alerts (contract).</td></tr>
<tr><td>Name, email, company, route, cargo and message</td><td>Quote requests / waitlist</td><td>Handle your request and pass it to matched service providers (consent). Kept for up to 180 days unless you ask us to delete it sooner. We also keep a salted hash of your IP address (not the address itself) to detect abuse. Short-lived rate-limit counters (minutes to hours) may use your IP address.</td></tr>
<tr><td>Payment details</td><td>Checkout</td><td>Handled by Paddle, our merchant of record. We receive subscription status, email and customer ID, not card numbers.</td></tr>
</tbody></table>
<h2>Who receives data</h2>
<ul>
<li><b>Cloudflare</b> (hosting, edge network, storage).</li>
<li><b>Paddle</b> (payments, tax and invoicing as merchant of record).</li>
<li><b>Email delivery provider</b> (sign-in links and alerts).</li>
<li><b>Public data providers</b> (US International Trade Commission HTS, postal-code and OpenStreetMap services, exchange-rate sources) receive the query you trigger via our proxy.</li>
<li><b>Matched service providers</b> receive your quote request only if you tick the consent box.</li>
<li><b>Analytics:</b> {{ANALYTICS_PROVIDER}}.</li>
</ul>
<h2>Cookies and local storage</h2>
<p>We do not set advertising or tracking cookies. We use localStorage for your tool settings, language preference, sign-in session and the return-visit counter. The Paddle checkout may set its own cookies.</p>
<h2>Your rights</h2>
<p>Depending on where you live (for example the EU/UK GDPR or California), you may have the right to access, correct, delete or export your data, to object to processing and to withdraw consent. Email {{CONTACT_EMAIL}}. You may also complain to your local data-protection authority.</p>
<h2>Retention, security and transfers</h2>
<p>Account data is kept while your account is active and as long as the law requires for invoices. Data is processed in Cloudflare\'s global network, which may involve transfers outside your country; we rely on appropriate safeguards where required.</p>
<h2>Children</h2>
<p>The site is for business users and is not directed to children.</p>
<h2>Changes</h2>
<p>We will update this page and its date when practices change.</p>`,
    },
    zh: {
      title: '隐私政策', desc: '本网站、工具、账户、支付和报价请求如何处理个人数据。',
      body: `
<p><b>简而言之：</b>免费工具在你的浏览器里运行。我们使用注重隐私的统计，不使用广告 Cookie。只有当你登录 Pro、提交报价请求或加入候补名单时，我们才会保存个人数据。</p>
<h2>我们是谁</h2>
<p>{{COMPANY_NAME}} 运营本网站（数据控制者）。联系方式：{{CONTACT_EMAIL}}。</p>
<h2>收集什么、为什么</h2>
<table class="tbl"><thead><tr><th>数据</th><th>何时</th><th>目的 / 法律依据</th></tr></thead><tbody>
<tr><td>工具输入（尺寸、编码、金额、图片）</td><td>使用工具时</td><td>在你的浏览器里计算，图片不会离开你的设备。部分查询（关税、邮编、汇率）会通过我们的代理转发给公开数据提供方；我们不保存这些请求的内容。</td></tr>
<tr><td>匿名使用事件和页面浏览（页面、来源网站、语言、设备类型、国家、回访次数区间）</td><td>浏览时</td><td>了解哪些页面和工具被使用、访客回访的频率（合法利益）。无广告 Cookie，无跨站追踪，事件接口不保存 IP 地址和 User-Agent。国家由边缘网络判定，仅保存国家代码。</td></tr>
<tr><td>回访计数</td><td>浏览时</td><td>浏览器里的一个小计数器（localStorage），用于发送匿名的“回访”事件。你可以在浏览器设置里清除。</td></tr>
<tr><td>邮箱、套餐状态、API Key 哈希、监控列表</td><td>Pro 账户</td><td>提供订阅、登录链接、API 和提醒（合同）。</td></tr>
<tr><td>姓名、邮箱、公司、线路、货物与留言</td><td>报价请求 / 候补名单</td><td>处理你的请求并转交匹配的服务商（同意）。最多保存 180 天，你可要求提前删除。我们还会保存 IP 地址的加盐哈希（不保存 IP 本身）用于识别滥用；限流计数器（保留几分钟到几小时）可能使用你的 IP 地址。</td></tr>
<tr><td>支付信息</td><td>结账</td><td>由 Merchant of Record Paddle 处理。我们只收到订阅状态、邮箱和客户 ID，不接触银行卡号。</td></tr>
</tbody></table>
<h2>谁会收到数据</h2>
<ul>
<li><b>Cloudflare</b>（托管、边缘网络、存储）。</li>
<li><b>Paddle</b>（作为 Merchant of Record 处理支付、税务和发票）。</li>
<li><b>邮件发送服务商</b>（登录链接与提醒）。</li>
<li><b>公开数据提供方</b>（美国国际贸易委员会 HTS、邮编与 OpenStreetMap 服务、汇率数据源）通过我们的代理收到你触发的查询。</li>
<li><b>匹配的服务商</b>只有在你勾选同意后才会收到你的报价请求。</li>
<li><b>统计：</b>{{ANALYTICS_PROVIDER}}。</li>
</ul>
<h2>Cookie 与本地存储</h2>
<p>我们不设置广告或追踪 Cookie。localStorage 用于保存工具设置、语言偏好、登录会话和回访计数。Paddle 结账页面可能设置自己的 Cookie。</p>
<h2>你的权利</h2>
<p>根据你所在地区（如欧盟/英国 GDPR 或加州法律），你可能有权访问、更正、删除或导出数据，反对处理以及撤回同意。请发邮件至 {{CONTACT_EMAIL}}。你也可以向当地数据保护机构投诉。</p>
<h2>保存期限、安全与跨境传输</h2>
<p>账户数据在账户有效期间保存，发票相关数据按法律要求保存。数据在 Cloudflare 全球网络中处理，可能涉及跨境传输；必要时我们采取适当保障措施。</p>
<h2>儿童</h2>
<p>本网站面向商业用户，不针对儿童。</p>
<h2>变更</h2>
<p>实践发生变化时，我们会更新本页及其日期。</p>`,
    },
  },
  terms: {
    en: {
      title: 'Terms of Service', desc: 'Terms for using the free tools, Pro subscription, API and quote-request features.',
      body: `
<h2>1. The service</h2>
<p>{{COMPANY_NAME}} ("we") provides web tools, a Chrome extension and a paid Pro plan for cross-border sellers and importers (the "Service"). By using the Service you agree to these terms.</p>
<h2>2. No professional advice</h2>
<p>Results (volumetric weight, currency, HS codes, tariffs, VAT, image sizes, policy updates) are estimates for reference. They are not customs, legal, tax or financial advice. Customs and marketplaces make the final decisions and rules change. You are responsible for verifying data before relying on it.</p>
<h2>3. Pro subscription</h2>
<p>Pro is billed in advance monthly or annually through Paddle, our merchant of record, who is the seller of record for your purchase and applies its own checkout terms. Subscriptions renew automatically until cancelled. You can cancel from your account or Paddle receipt; access continues until the end of the paid period. Prices may change with notice before your next renewal. See the <a href="{{page:refund}}">refund policy</a>.</p>
<h2>4. API and acceptable use</h2>
<p>API keys are personal to your account and must be kept secret. Do not resell raw API access, circumvent limits, scrape the site at scale, or use the Service to break the law. We may rate-limit or suspend abusive use.</p>
<h2>5. Third-party services and partners</h2>
<p>The Service relies on public data providers and may link to partners. We are not responsible for third-party services or content. Partner links may earn us a commission; see the <a href="{{page:affiliate-disclosure}}">affiliate disclosure</a>. Any agreement with a partner is between you and that partner.</p>
<h2>6. Intellectual property</h2>
<p>The Service, its code and content belong to us or our licensors. Marketplace, carrier and brand names belong to their owners and are used only to describe compatibility.</p>
<h2>7. Availability and changes</h2>
<p>We aim for high availability but provide the Service "as is". We may change or discontinue features, with reasonable notice for paid features.</p>
<h2>8. Liability</h2>
<p>To the maximum extent permitted by law, we are not liable for indirect or consequential losses, lost profits or customs penalties arising from your use of the Service, and our total liability is limited to the amount you paid in the 12 months before the claim. Nothing limits liability that cannot be limited by law.</p>
<h2>9. Governing law</h2>
<p>These terms are governed by the laws of {{GOVERNING_LAW}}. Mandatory consumer rights in your country remain unaffected.</p>
<h2>10. Contact</h2>
<p>{{CONTACT_EMAIL}}</p>`,
    },
    zh: {
      title: '服务条款', desc: '使用免费工具、Pro 订阅、API 和报价请求功能的条款。',
      body: `
<h2>1. 服务内容</h2>
<p>{{COMPANY_NAME}}（“我们”）为跨境卖家和进口商提供网页工具、Chrome 扩展和付费 Pro 套餐（“服务”）。使用服务即表示你同意本条款。</p>
<h2>2. 不构成专业意见</h2>
<p>结果（体积重、汇率、HS 编码、关税、VAT、图片尺寸、政策更新）为估算，仅供参考，不构成报关、法律、税务或财务意见。最终由海关和平台决定，且规则会变化。你需要在依赖数据前自行核实。</p>
<h2>3. Pro 订阅</h2>
<p>Pro 按月或按年通过 Paddle 预付，Paddle 是你此次购买的 Merchant of Record（销售方），并适用其结账条款。订阅会自动续费直到取消。你可以在账户或 Paddle 收据中取消，已付费周期结束前仍可使用。价格调整会在下次续费前通知。退款见<a href="{{page:refund}}">退款政策</a>。</p>
<h2>4. API 与可接受使用</h2>
<p>API Key 属于你的账户，须妥善保密。不得转售原始 API 访问、规避限额、大规模抓取本站，或将服务用于违法用途。我们可对滥用行为限速或暂停。</p>
<h2>5. 第三方服务与合作伙伴</h2>
<p>服务依赖公开数据提供方，并可能链接到合作伙伴。我们不对第三方服务或内容负责。合作伙伴链接可能让我们获得佣金，见<a href="{{page:affiliate-disclosure}}">联盟披露</a>。你与合作伙伴之间的任何协议仅在你们之间成立。</p>
<h2>6. 知识产权</h2>
<p>服务及其代码、内容归我们或授权方所有。平台、承运商和品牌名称归其所有者，仅用于说明兼容性。</p>
<h2>7. 可用性与变更</h2>
<p>我们力求高可用，但服务按“现状”提供。我们可能变更或终止功能，付费功能会提前合理通知。</p>
<h2>8. 责任</h2>
<p>在法律允许的最大范围内，我们不对因你使用服务造成的间接或后果性损失、利润损失或海关处罚负责，我们的总责任以你在索赔前 12 个月内支付的金额为限。法律不允许限制的责任不受此限。</p>
<h2>9. 适用法律</h2>
<p>本条款适用 {{GOVERNING_LAW}} 法律。你所在国家的强制性消费者权利不受影响。</p>
<h2>10. 联系方式</h2>
<p>{{CONTACT_EMAIL}}</p>`,
    },
  },
  refund: {
    en: {
      title: 'Refund Policy', desc: 'Refund terms for Pro subscriptions: a full refund within the refund window on your first payment, how renewals and cancellations work, and how to ask.',
      body: `
<p>We want Pro to be worth it. If it is not, we will refund you.</p>
<ul>
<li><b>First payment:</b> request a full refund within <b>{{REFUND_DAYS}} days</b> of your first Pro payment, no questions asked.</li>
<li><b>Renewals:</b> if you forgot to cancel, contact us within {{REFUND_DAYS}} days of the renewal and we will refund it if you have not used the Pro features since.</li>
<li><b>Cancelling:</b> you can cancel at any time. You keep Pro until the end of the period you paid for; we do not pro-rate partial periods.</li>
</ul>
<h2>How to request a refund</h2>
<p>Email {{CONTACT_EMAIL}} from the address you used at checkout, or use the link on your Paddle receipt. Refunds go back to the original payment method. Paddle, as merchant of record, issues the refund and the processing time depends on your payment provider.</p>
<p>Statutory consumer rights in your country are not affected by this policy.</p>`,
    },
    zh: {
      title: '退款政策', desc: 'Pro 订阅的退款条款：首次付款在退款期内可全额退款，续费和取消的规则，以及如何申请退款。',
      body: `
<p>我们希望 Pro 物有所值。如果不是，我们会退款。</p>
<ul>
<li><b>首次付款：</b>首次 Pro 付款后 <b>{{REFUND_DAYS}} 天</b>内可申请全额退款，无需理由。</li>
<li><b>续费：</b>如果忘记取消，请在续费后 {{REFUND_DAYS}} 天内联系我们；若其间未使用 Pro 功能，我们会退款。</li>
<li><b>取消：</b>可随时取消。你可使用 Pro 至已付费周期结束，不按未使用天数折算。</li>
</ul>
<h2>如何申请退款</h2>
<p>请用结账邮箱发邮件至 {{CONTACT_EMAIL}}，或使用 Paddle 收据里的链接。退款原路返回。作为 Merchant of Record，Paddle 负责退款，到账时间取决于你的支付服务商。</p>
<p>本政策不影响你所在国家法定的消费者权利。</p>`,
    },
  },
  'affiliate-disclosure': {
    en: {
      title: 'Affiliate & Advertising Disclosure', desc: 'How we earn money from partner links, referrals and lead generation, and how it affects what we show.',
      body: `
<p>Some links on this site are <b>affiliate or referral links</b>. If you click one and buy or sign up, we may earn a commission or a referral fee at no extra cost to you. Links are marked "Sponsored" or "Partner" and carry <code>rel="sponsored nofollow"</code>.</p>
<h2>Quote requests</h2>
<p>When you submit a quote request, we may share it with matched service providers (freight forwarders, overseas warehouses, VAT filing firms, customs brokers, payment providers) and may be paid for qualified leads. We share your details only if you tick the consent box on the form.</p>
<h2>Editorial independence</h2>
<p>Our calculators, data and guides are not influenced by partner payments. Partner placements are labelled and kept separate from tool results. We do not guarantee any partner\'s service, price or availability, and any agreement is between you and the partner.</p>
<h2>Questions</h2>
<p>{{CONTACT_EMAIL}}</p>`,
    },
    zh: {
      title: '联盟与广告披露', desc: '我们如何通过合作伙伴链接、推荐和线索获得收入，以及这对展示内容的影响。',
      body: `
<p>本站部分链接是<b>联盟或推荐链接</b>。如果你点击并购买或注册，我们可能获得佣金或推荐费，不会增加你的费用。这类链接会标注“赞助”或“合作伙伴”，并带有 <code>rel="sponsored nofollow"</code>。</p>
<h2>报价请求</h2>
<p>你提交报价请求时，我们可能把它分享给匹配的服务商（货代、海外仓、VAT 申报机构、报关行、支付服务商），并可能因合格线索获得费用。只有在你勾选表单上的同意框时，我们才会分享你的信息。</p>
<h2>编辑独立性</h2>
<p>我们的计算器、数据和指南不受合作伙伴付款影响。合作伙伴位置有明确标注，并与工具结果分开。我们不保证任何合作伙伴的服务、价格或可用性，你与合作伙伴之间的任何协议仅在你们之间成立。</p>
<h2>问题</h2>
<p>{{CONTACT_EMAIL}}</p>`,
    },
  },
  about: {
    en: {
      title: 'About', desc: 'Why we built Cross-border Trade Toolkit and how we keep the data honest.',
      body: `
<p>Cross-border Trade Toolkit started as a Chrome extension for the small calculations and look-ups that cross-border sellers repeat every day. This website puts the same tools on their own pages, adds guides and reference data, and offers a Pro plan for teams that need bulk processing, exports, an API and policy alerts.</p>
<h2>How we keep it honest</h2>
<ul>
<li>Reference data carries an as-of date, and the policy updates page shows what we last reviewed.</li>
<li>Marketplace image sizes are reference values from public guidance; we tell you to confirm in your seller dashboard.</li>
<li>Images are processed in your browser and never uploaded.</li>
<li>Partner links are labelled, and the tools are not influenced by partner payments.</li>
</ul>
<p>Feedback and corrections are welcome: {{CONTACT_EMAIL}}.</p>`,
    },
    zh: {
      title: '关于我们', desc: '我们为什么做跨境电商工具箱，以及如何保证数据诚实。',
      body: `
<p>跨境电商工具箱最初是一个 Chrome 扩展，解决跨境卖家每天重复的小计算和小查询。这个网站把同样的工具放到各自独立的页面，增加指南和参考数据，并为需要批量处理、导出、API 和政策提醒的团队提供 Pro 套餐。</p>
<h2>我们如何保持诚实</h2>
<ul>
<li>参考数据标注更新日期，政策更新页展示我们最近复核了什么。</li>
<li>平台图片尺寸是公开指南整理的参考值，并提示你以卖家后台为准。</li>
<li>图片在你的浏览器里处理，不会上传。</li>
<li>合作伙伴链接有明确标注，工具不受合作伙伴付款影响。</li>
</ul>
<p>欢迎反馈和纠错：{{CONTACT_EMAIL}}。</p>`,
    },
  },
  contact: {
    en: { title: 'Contact', desc: 'Contact us about the tools, Pro, partnerships or data corrections.', body: `<p>Email: <a href="mailto:{{CONTACT_EMAIL}}">{{CONTACT_EMAIL}}</a></p><p>For data corrections, please include the page URL and the official source. For Pro billing, include the email used at checkout.</p>` },
    zh: { title: '联系我们', desc: '关于工具、Pro 订阅、合作伙伴或数据纠错，欢迎通过邮件联系我们，我们会尽快回复。', body: `<p>邮箱：<a href="mailto:{{CONTACT_EMAIL}}">{{CONTACT_EMAIL}}</a></p><p>数据纠错请附上页面链接和官方来源。Pro 账单问题请附上结账邮箱。</p>` },
  },
};
