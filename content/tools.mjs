// Tool pages: one independent, indexable page per tool (EN primary, ZH secondary).
// `id` is the tool id inside the shared extension code (cbt-toolkit/js/tools/<id>.js).
// Section bodies are trusted HTML. Keep claims factual and hedge anything carrier/regulator specific.

export const TOOLS = [
  {
    id: 'volume',
    slug: 'volumetric-weight-calculator',
    icon: '📦',
    updated: '2026-10-14',
    related: ['unit-converter', 'postal-code-lookup', 'us-tariff-calculator'],
    en: {
      nav: 'Volumetric weight',
      title: 'Volumetric Weight Calculator (DHL, FedEx, UPS, Air & Sea) | Free',
      desc: 'Free volumetric (dimensional) weight calculator: L × W × H ÷ divisor (5000, 6000, 139…), compared with actual weight. cm/kg or in/lb, multiple pieces, 0.5 rounding.',
      h1: 'Volumetric Weight Calculator',
      lead: 'Carriers bill the greater of actual weight and volumetric weight. Enter your carton size and weight to see the chargeable weight in seconds.',
      sections: [
        { h: 'How volumetric weight is calculated', body: `
          <p>Volumetric (also called dimensional or DIM) weight converts the space a parcel takes up into a weight, so light but bulky parcels are priced fairly.</p>
          <p class="formula">Volumetric weight (kg) = Length × Width × Height (cm) ÷ divisor</p>
          <p>The divisor depends on the carrier and service. The calculator includes the common ones: <b>5000</b> (typical international express), <b>6000</b> (air freight and many international lines), <b>4000</b> and <b>8000</b> (some lines), <b>1000</b> for sea LCL where 1 CBM is treated as 1,000 kg, and <b>139 / 166</b> for in³-per-lb systems used in the US.</p>
          <p><b>Example:</b> a 40 × 30 × 20 cm carton weighing 3.2 kg → 24,000 cm³ ÷ 5000 = <b>4.8 kg</b>. The chargeable weight is 4.8 kg because it is higher than the actual 3.2 kg.</p>` },
        { h: 'Three ways carriers measure a parcel', body: `
          <p><b>Standard carton:</b> use the outside length, width and height of the box.</p>
          <p><b>Bulging parcel:</b> if the contents make the box bulge, measure the bulged size, not the printed carton size.</p>
          <p><b>Irregular parcel:</b> use the longest length, longest width and longest height, as if the parcel sat in a rectangular box.</p>` },
        { h: 'Ways to lower your chargeable weight', body: `
          <ul>
            <li>Right-size the carton: removing 2 cm on each side can drop a size band.</li>
            <li>Compress soft goods (apparel, bedding) with vacuum bags where the product allows.</li>
            <li>Ship dense goods separately from bulky goods instead of mixing them in one carton.</li>
            <li>Ask your carrier or forwarder which divisor and rounding rule applies to your contract. Rates and rules change.</li>
          </ul>` },
      ],
      faq: [
        { q: 'What is chargeable weight?', a: 'Chargeable weight is the weight a carrier uses to price a shipment: the greater of the actual (gross) weight and the volumetric weight, usually rounded up to the carrier\'s increment.' },
        { q: 'Which divisor does my carrier use?', a: 'Many international express services use 5000 and many air-freight services use 6000, but divisors vary by carrier, service and contract. Check your rate card or ask your account manager. The calculator lets you type any divisor.' },
        { q: 'Does volumetric weight apply to sea freight?', a: 'LCL sea freight is commonly priced per cubic metre or per tonne, whichever is greater. The 1000 preset treats 1 CBM as 1,000 kg. FCL is priced per container.' },
        { q: 'Why is the result rounded to 0.5 kg?', a: 'Several express carriers round chargeable weight up to the next 0.5 kg. Tick the 0.5 option to see that rounding; confirm the rule with your carrier.' },
        { q: 'Can I calculate in inches and pounds?', a: 'Yes. Switch the unit system to in/lb and use the 139 or 166 divisors, which are expressed in cubic inches per pound.' },
      ],
    },
    zh: {
      nav: '体积重',
      title: '体积重计算器（DHL / FedEx / UPS / 空运 / 海运）| 免费',
      desc: '免费体积重（材积重）计算器：长×宽×高÷系数（5000、6000、139 等），与实际重量对比，支持 cm·kg 与 in·lb、多件、0.5 进位。',
      h1: '体积重计算器',
      lead: '承运商按“实际重量”和“体积重量”中较大者计费。输入箱规和重量，几秒内得到计费重量。',
      sections: [
        { h: '体积重怎么算', body: `
          <p>体积重（又称材积重、DIM 重）把包裹占用的空间折算成重量，让“轻但占地方”的货物也能被合理计价。</p>
          <p class="formula">体积重（kg）= 长 × 宽 × 高（cm）÷ 系数</p>
          <p>系数因承运商和服务而异。本工具内置常见系数：<b>5000</b>（常见国际快递）、<b>6000</b>（空运及多数国际专线）、<b>4000</b> 与 <b>8000</b>（部分专线）、<b>1000</b>（海运拼箱，1CBM 按 1000kg）、<b>139 / 166</b>（美国以 in³/lb 表示的系数）。</p>
          <p><b>示例：</b>40 × 30 × 20 cm、实重 3.2 kg 的纸箱 → 24,000 cm³ ÷ 5000 = <b>4.8 kg</b>，高于实重，所以计费重量为 4.8 kg。</p>` },
        { h: '三种常见的量尺方式', body: `
          <p><b>标准纸箱：</b>按纸箱外尺寸的长、宽、高计算。</p>
          <p><b>凸起包裹：</b>货物把箱子撑得鼓起来时，按鼓起后的实际尺寸量。</p>
          <p><b>不规则包裹：</b>取最长长度、最长宽度、最长高度，按长方体包住它来计算。</p>` },
        { h: '降低计费重量的办法', body: `
          <ul>
            <li>按货物选合适的纸箱：每边少 2 cm，可能就降一档。</li>
            <li>服装、被褥等软包装商品在允许的情况下用真空袋压缩。</li>
            <li>高密度货与大体积货分箱发，别混装。</li>
            <li>向承运商或货代确认适用的系数和进位规则，规则会变。</li>
          </ul>` },
      ],
      faq: [
        { q: '什么是计费重量？', a: '计费重量是承运商用来计价的重量：实际（毛）重量与体积重量中较大的一个，通常再按承运商的进位规则向上取整。' },
        { q: '我的承运商用哪个系数？', a: '很多国际快递用 5000、很多空运用 6000，但不同承运商、服务和合同可能不同。请查看报价单或询问客户经理。本工具支持手动输入任意系数。' },
        { q: '海运也有体积重吗？', a: '海运拼箱（LCL）通常按立方米或吨取较大者计价；预设 1000 表示 1CBM 按 1000kg。整柜按柜型计价。' },
        { q: '为什么要 0.5 进位？', a: '部分快递会把计费重量向上取到下一个 0.5kg。勾选 0.5 进位即可查看；具体规则以承运商为准。' },
        { q: '可以用英寸和磅计算吗？', a: '可以。把单位切换为 in/lb，并使用以立方英寸/磅表示的 139 或 166 系数。' },
      ],
    },
  },

  {
    id: 'units',
    slug: 'unit-converter',
    icon: '📐',
    updated: '2026-10-14',
    related: ['volumetric-weight-calculator', 'currency-converter', 'time-zone-converter'],
    en: {
      nav: 'Unit converter',
      title: 'Shipping Unit Converter: cm ⇄ in, kg ⇄ lb, CBM ⇄ ft³, °C ⇄ °F',
      desc: 'Convert length, weight, volume, area and temperature between metric, imperial and Chinese units. Click a result to copy it. Built for cross-border sellers.',
      h1: 'Unit Converter for Sellers',
      lead: 'Product specs, carton sizes and freight quotes rarely use the same units. Convert length, weight, volume, area and temperature in one place.',
      sections: [
        { h: 'Conversions sellers use every day', body: `
          <ul>
            <li><b>Length:</b> 1 in = 2.54 cm exactly; 1 ft = 30.48 cm; 1 yd = 0.9144 m.</li>
            <li><b>Weight:</b> 1 lb = 0.45359237 kg exactly; 1 oz = 28.3495 g; 1 kg ≈ 2.2046 lb.</li>
            <li><b>Volume:</b> 1 m³ (CBM) ≈ 35.3147 ft³; 1 ft³ ≈ 28.3168 L; 1 US gal ≈ 3.7854 L.</li>
            <li><b>Temperature:</b> °F = °C × 9/5 + 32.</li>
          </ul>` },
        { h: 'Tips for product listings', body: `
          <p>Marketplaces often ask for dimensions in inches and weight in pounds for US listings, but centimetres and kilograms for EU or Asian ones. Convert once, then round sensibly: keep two decimals for weight, one decimal for dimensions.</p>
          <p>Need the volumetric weight too? Use the <a href="{{tool:volumetric-weight-calculator}}">volumetric weight calculator</a>.</p>` },
      ],
      faq: [
        { q: 'How many cubic feet are in a cubic metre?', a: 'One cubic metre is about 35.3147 cubic feet.' },
        { q: 'How many kilograms is one pound?', a: 'One pound is exactly 0.45359237 kilograms.' },
        { q: 'Does it support Chinese units?', a: 'Yes. The converter includes common Chinese market units for length and weight alongside metric and imperial.' },
      ],
    },
    zh: {
      nav: '单位换算',
      title: '跨境单位换算：cm⇄in、kg⇄lb、CBM⇄ft³、℃⇄℉',
      desc: '长度、重量、体积、面积、温度在公制、英制和市制之间换算，点击结果即可复制。为跨境卖家设计。',
      h1: '卖家单位换算器',
      lead: '商品规格、箱规和运费报价很少用同一套单位。在一个页面里换算长度、重量、体积、面积和温度。',
      sections: [
        { h: '卖家每天用到的换算', body: `
          <ul>
            <li><b>长度：</b>1 in = 2.54 cm（精确）；1 ft = 30.48 cm；1 yd = 0.9144 m。</li>
            <li><b>重量：</b>1 lb = 0.45359237 kg（精确）；1 oz = 28.3495 g；1 kg ≈ 2.2046 lb。</li>
            <li><b>体积：</b>1 m³（CBM）≈ 35.3147 ft³；1 ft³ ≈ 28.3168 L；1 美制加仑 ≈ 3.7854 L。</li>
            <li><b>温度：</b>℉ = ℃ × 9/5 + 32。</li>
          </ul>` },
        { h: '刊登商品时的小提示', body: `
          <p>美国站常要求英寸和磅，欧洲或亚洲站常用厘米和千克。先换算再合理取整：重量保留两位小数，尺寸保留一位小数。</p>
          <p>还要算体积重？试试<a href="{{tool:volumetric-weight-calculator}}">体积重计算器</a>。</p>` },
      ],
      faq: [
        { q: '1 立方米等于多少立方英尺？', a: '1 立方米约等于 35.3147 立方英尺。' },
        { q: '1 磅等于多少千克？', a: '1 磅精确等于 0.45359237 千克。' },
        { q: '支持市制单位吗？', a: '支持。工具内置常见的市制长度和重量单位，与公制、英制一起换算。' },
      ],
    },
  },

  {
    id: 'rates',
    slug: 'currency-converter',
    icon: '💱',
    updated: '2026-10-14',
    related: ['eu-import-duty-vat-calculator', 'us-tariff-calculator', 'time-zone-converter'],
    en: {
      nav: 'Currency converter',
      title: 'Currency Converter for Sellers: Live FX Rates with Fee / Spread',
      desc: 'Convert between 160+ currencies with daily FX rates, an optional spread or platform fee, and your own favourite currencies. Mid-market rates for quoting and pricing.',
      h1: 'Currency Converter for Cross-border Sellers',
      lead: 'Price products, check supplier quotes and estimate payouts. Add the spread or fee your payment provider charges to see a realistic result.',
      sections: [
        { h: 'Mid-market rates vs the rate you actually get', body: `
          <p>The table shows <b>mid-market</b> rates: the midpoint between buy and sell prices on the interbank market. Banks, PayPal-style wallets, marketplaces and payout providers usually add a spread or fee on top, often 0.5%–4%.</p>
          <p>Enter your provider\'s markup in the <b>Spread / fee</b> field and the converted amounts are reduced accordingly, so you can compare real costs between providers.</p>` },
        { h: 'Where the rates come from', body: `
          <p>Rates are fetched from public exchange-rate data sources (primary source plus two fallbacks) and cached for six hours. The date of the data is shown above the table. Rates are for reference; your bank or payment platform settles at its own rate.</p>` },
        { h: 'Pricing tips', body: `
          <ul>
            <li>Quote in the buyer\'s currency but keep a margin for FX movement.</li>
            <li>Include the platform\'s currency-conversion fee in your landed-cost model.</li>
            <li>For duties and VAT, see the <a href="{{tool:eu-import-duty-vat-calculator}}">EU import duty & VAT calculator</a>.</li>
          </ul>` },
      ],
      faq: [
        { q: 'How often are the rates updated?', a: 'The data source updates daily, and this tool caches results for six hours to stay fast and polite to the free data providers.' },
        { q: 'Why does my bank show a different rate?', a: 'Banks and payment providers add a spread. Use the spread field to approximate it.' },
        { q: 'Can I use it for invoices or accounting?', a: 'No. Use the rate your bank, payment provider or tax authority requires for official documents.' },
      ],
    },
    zh: {
      nav: '汇率换算',
      title: '卖家汇率换算器：实时汇率 + 点差/手续费',
      desc: '160+ 币种每日汇率换算，可加点差或平台手续费，常用币种自选。适合报价、定价和估算回款。',
      h1: '跨境卖家汇率换算器',
      lead: '给商品定价、核对供应商报价、估算回款。把收款工具的点差或手续费加进去，得到更接近实际的结果。',
      sections: [
        { h: '中间价 vs 实际到手汇率', body: `
          <p>表格展示的是<b>市场中间价</b>：银行间买卖价的中点。银行、钱包、平台和收款工具通常会在上面加点差或手续费，常见 0.5%–4%。</p>
          <p>在“点差 / 手续费”里填入你的服务商加价，换算结果会相应扣减，方便比较不同渠道的真实成本。</p>` },
        { h: '数据来源', body: `
          <p>汇率来自公开汇率数据源（一个主源和两个备用源），本地缓存 6 小时。表格上方会显示数据日期。仅供参考，实际以银行或支付平台结汇为准。</p>` },
        { h: '定价小建议', body: `
          <ul>
            <li>用买家的币种报价，但要给汇率波动留出余量。</li>
            <li>把平台的货币转换费计入到岸成本模型。</li>
            <li>关税和增值税见<a href="{{tool:eu-import-duty-vat-calculator}}">欧盟关税与 VAT 计算器</a>。</li>
          </ul>` },
      ],
      faq: [
        { q: '汇率多久更新一次？', a: '数据源每日更新，本工具缓存 6 小时，兼顾速度和对免费数据源的友好使用。' },
        { q: '为什么银行显示的汇率不一样？', a: '银行和支付服务商会加点差。可以用“点差”输入框近似模拟。' },
        { q: '能用来开发票或做账吗？', a: '不能。正式单据请使用银行、支付服务商或税务机关要求的汇率。' },
      ],
    },
  },

  {
    id: 'timezone',
    slug: 'time-zone-converter',
    icon: '🕒',
    updated: '2026-10-14',
    related: ['country-codes', 'currency-converter', 'postal-code-lookup'],
    en: {
      nav: 'Time zones',
      title: 'Time Zone Converter & World Clock for Global Sellers',
      desc: 'Live world clock with automatic daylight saving, custom home zone and cities, working-hours hints and any-time conversion for suppliers, buyers and carriers.',
      h1: 'Time Zone Converter & World Clock',
      lead: 'Know when your supplier is at their desk and when your buyer is asleep. Add the cities you work with and convert any date and time.',
      sections: [
        { h: 'Why time zones matter in cross-border trade', body: `
          <p>Quotes, order cut-offs, customer-service windows and carrier pickups all run on local time. A missed cut-off can mean an extra day of transit.</p>
          <p>The clock follows the IANA time-zone database, so daylight saving changes are handled automatically. Set your <b>home zone</b> and the tool shows each city\'s offset from you and whether it is currently working hours there.</p>` },
        { h: 'Daylight saving gotchas', body: `
          <ul>
            <li>The US and the EU switch on different dates, so the gap between New York and Berlin changes for a few weeks each spring and autumn.</li>
            <li>China does not observe daylight saving, so its offset from the US and EU shifts by one hour twice a year.</li>
            <li>Many countries, including India and Japan, do not use daylight saving either.</li>
          </ul>` },
      ],
      faq: [
        { q: 'What is the time difference between China and New York?', a: 'Beijing is UTC+8. New York is UTC−5 in winter and UTC−4 in summer, so the difference is 13 or 12 hours. The converter shows the exact value for any date.' },
        { q: 'Can I add my own cities?', a: 'Yes. Pick a city from the list and it is saved in your browser for next time.' },
        { q: 'Does it handle daylight saving automatically?', a: 'Yes. It uses your browser\'s IANA time-zone data for each date.' },
      ],
    },
    zh: {
      nav: '时区查询',
      title: '时区转换与世界时钟（跨境卖家版）',
      desc: '实时世界时钟，自动处理夏令时，可自定义主时区和城市，提示对方是否在上班时间，支持任意时间换算。',
      h1: '时区转换与世界时钟',
      lead: '知道供应商什么时候在工位、买家什么时候在睡觉。添加你常联系的城市，换算任意日期和时间。',
      sections: [
        { h: '为什么跨境贸易要关注时区', body: `
          <p>报价、截单时间、客服时段和承运商取件都以当地时间为准。错过截单可能就多等一天。</p>
          <p>时钟基于 IANA 时区数据库，夏令时会自动处理。设置好<b>主时区</b>后，工具会显示各城市与你的时差，以及对方现在是否在上班时间。</p>` },
        { h: '夏令时的几个坑', body: `
          <ul>
            <li>美国和欧盟切换夏令时的日期不同，纽约与柏林的时差每年春秋会有几周发生变化。</li>
            <li>中国不实行夏令时，所以与欧美的时差一年里会变化两次。</li>
            <li>印度、日本等许多国家同样不使用夏令时。</li>
          </ul>` },
      ],
      faq: [
        { q: '中国和纽约的时差是多少？', a: '北京为 UTC+8；纽约冬季 UTC−5、夏季 UTC−4，所以时差为 13 或 12 小时。工具会按具体日期给出准确值。' },
        { q: '可以添加自己的城市吗？', a: '可以。从列表里选城市，会保存在你的浏览器里，下次直接用。' },
        { q: '会自动处理夏令时吗？', a: '会。工具使用浏览器的 IANA 时区数据，按每个日期计算。' },
      ],
    },
  },

  {
    id: 'countries',
    slug: 'country-codes',
    icon: '🌍',
    updated: '2026-10-14',
    related: ['time-zone-converter', 'postal-code-lookup', 'hs-code-lookup'],
    staticTable: 'countries',
    en: {
      nav: 'Country codes',
      title: 'Country Codes: ISO 2-Letter, 3-Letter & Dialing Codes (250)',
      desc: 'Search ISO 3166-1 alpha-2 and alpha-3 country codes and international dialing codes for 250 countries and regions, with the live time difference from your time zone.',
      h1: 'Country Codes: ISO 2-Letter, 3-Letter & Dialing Codes',
      lead: 'Look up the two-letter code, three-letter code and calling code of any country or region. The full table is below the search box.',
      sections: [
        { h: 'Which code is used where?', body: `
          <ul>
            <li><b>Alpha-2 (e.g. US, DE, CN):</b> used in addresses, marketplace country fields, customs forms, VAT numbers and domain names (mostly).</li>
            <li><b>Alpha-3 (e.g. USA, DEU, CHN):</b> common on customs declarations and in trade statistics.</li>
            <li><b>Dialing codes (e.g. +1, +49, +86):</b> prefix for international phone numbers. Several countries share one code, for example +1 is used by the US, Canada and several Caribbean nations.</li>
          </ul>` },
        { h: 'Common mix-ups', body: `
          <ul>
            <li>The United Kingdom is <b>GB</b> in ISO 3166-1, although <b>.uk</b> is its domain and "UK" is widely used informally.</li>
            <li>Greece is <b>GR</b> in ISO 3166-1; EU VAT numbers for Greece begin with <b>EL</b>.</li>
            <li>Hong Kong (HK), Macao (MO) and Taiwan (TW) have their own entries in the ISO list.</li>
          </ul>` },
      ],
      faq: [
        { q: 'What is the country code for the United States?', a: 'ISO alpha-2: US. Alpha-3: USA. Dialing code: +1.' },
        { q: 'What is the difference between ISO alpha-2 and alpha-3?', a: 'Alpha-2 is a two-letter code, alpha-3 is a three-letter code. Both identify the same country; which one you need depends on the form or system.' },
        { q: 'Are the country names localised?', a: 'Yes. Names follow the language of the page.' },
      ],
    },
    zh: {
      nav: '国家二字码',
      title: '国家/地区代码表：ISO 二字码、三字码、电话区号（250 个）',
      desc: '查询 250 个国家和地区的 ISO 3166-1 二字码、三字码和国际电话区号，并显示与你所在时区的实时时差。',
      h1: '国家/地区二字码、三字码与电话区号',
      lead: '查任意国家或地区的二字码、三字码和国际区号。完整表格在搜索框下方。',
      sections: [
        { h: '不同代码用在哪里', body: `
          <ul>
            <li><b>二字码（如 US、DE、CN）：</b>地址、平台国家字段、报关单、VAT 号和域名（大多数）中使用。</li>
            <li><b>三字码（如 USA、DEU、CHN）：</b>常见于报关单和贸易统计。</li>
            <li><b>电话区号（如 +1、+49、+86）：</b>国际电话前缀。有些区号被多个国家共用，例如 +1 同时用于美国、加拿大和若干加勒比国家。</li>
          </ul>` },
        { h: '容易混淆的地方', body: `
          <ul>
            <li>英国在 ISO 3166-1 中是 <b>GB</b>，虽然域名是 <b>.uk</b>，口头也常说 UK。</li>
            <li>希腊在 ISO 中是 <b>GR</b>，但希腊的欧盟 VAT 号以 <b>EL</b> 开头。</li>
            <li>香港（HK）、澳门（MO）、台湾（TW）在 ISO 列表中各有独立条目。</li>
          </ul>` },
      ],
      faq: [
        { q: '美国的国家代码是什么？', a: 'ISO 二字码 US，三字码 USA，电话区号 +1。' },
        { q: 'ISO 二字码和三字码有什么区别？', a: '二字码是两个字母，三字码是三个字母，指向同一个国家；具体用哪个取决于表单或系统。' },
        { q: '国家名称会本地化吗？', a: '会，名称随页面语言显示。' },
      ],
    },
  },

  {
    id: 'hs',
    slug: 'hs-code-lookup',
    icon: '🔎',
    updated: '2026-10-14',
    related: ['us-tariff-calculator', 'eu-import-duty-vat-calculator', 'country-codes'],
    en: {
      nav: 'HS code lookup',
      title: 'HS Code Lookup: Find Harmonized System Codes by Product Name',
      desc: 'Find 6-digit HS reference codes for 300+ common cross-border products in English or Chinese, search the official US HTS online, and jump to US tariff or EU TARIC.',
      h1: 'HS Code Lookup',
      lead: 'Type a product name (English or Chinese) or a code. Get the 6-digit HS reference, classification notes, and one-click links to US and EU tariff look-ups.',
      sections: [
        { h: 'What an HS code is', body: `
          <p>The Harmonized System (HS) is the international product nomenclature maintained by the World Customs Organization. The <b>first 6 digits</b> are shared by more than 200 countries and territories; each country then adds its own digits: 8 digits in the EU (CN code), 10 in the US (HTS) and 10 in China.</p>
          <p>Chapters (2 digits) group goods broadly, headings (4 digits) narrow them down and subheadings (6 digits) identify the product type. Example: <code>8518</code> is the heading for microphones, loudspeakers and headphones, and <code>8518.30</code> is headphones and earphones.</p>` },
        { h: 'How to use the results', body: `
          <ol>
            <li>Search the product and pick the closest 6-digit entry.</li>
            <li>Read the note: material, function and processing often change the heading (for example, a smartwatch with data transmission is classified differently from a time-only watch).</li>
            <li>Open the US or EU tariff tool with the code to see national lines and duty rates.</li>
            <li>For anything valuable or uncertain, ask a licensed customs broker or request a binding ruling. Customs makes the final decision.</li>
          </ol>` },
        { h: 'Good to know', body: `
          <p>The built-in list is a <b>reference</b> for common product types using HS 2022 subheadings; it does not cover every product. The online US HTS search matches US tariff wording, so English keywords work best. The WCO publishes new HS editions every five years; check your customs authority\'s notices for transitions.</p>` },
      ],
      faq: [
        { q: 'How do I find the HS code for my product?', a: 'Search the product name here, choose the closest 6-digit entry, then confirm the national 8–10 digit code in the tariff tool of your destination country. Classification depends on material, use and composition.' },
        { q: 'Is the HS code the same in every country?', a: 'Only the first 6 digits. The EU uses 8 digits, the US and China use 10, and rates differ by country.' },
        { q: 'Can I rely on this for customs declarations?', a: 'It is a reference tool. Customs authorities decide classification; use a licensed broker or an official ruling when it matters.' },
      ],
    },
    zh: {
      nav: 'HS 编码查询',
      title: 'HS 编码查询：按商品名称查海关编码（中英文）',
      desc: '中英文品名查 300+ 常见跨境商品的 HS6 参考编码，在线检索美国 HTS，一键跳转美国关税或欧盟 TARIC。',
      h1: 'HS 编码查询',
      lead: '输入商品名（中文或英文）或编码，获得 6 位 HS 参考编码、归类提示，并一键跳转到美国和欧盟的关税查询。',
      sections: [
        { h: '什么是 HS 编码', body: `
          <p>协调制度（HS）是世界海关组织（WCO）维护的国际商品分类体系。<b>前 6 位</b>被 200 多个国家和地区共用，之后各国再细分：欧盟 8 位（CN 编码）、美国 10 位（HTS）、中国 10 位。</p>
          <p>章（2 位）大类，品目（4 位）缩小范围，子目（6 位）确定商品类型。例如 <code>8518</code> 是麦克风、扬声器、耳机的品目，<code>8518.30</code> 是耳机及耳塞。</p>` },
        { h: '怎么使用查询结果', body: `
          <ol>
            <li>搜索商品，选择最接近的 6 位条目。</li>
            <li>阅读提示：材质、功能和加工程度常会改变归类（例如带数据传输功能的智能手表与仅显示时间的手表归类不同）。</li>
            <li>带着编码打开美国或欧盟关税工具，查看各国税号和税率。</li>
            <li>金额较大或拿不准时，请咨询持牌报关行或申请预归类。最终以海关认定为准。</li>
          </ol>` },
        { h: '需要知道的事', body: `
          <p>内置库是<b>参考</b>，覆盖常见品类（HS 2022 子目），并不包含所有商品。美国 HTS 在线检索匹配的是美国税则的英文描述，所以用英文关键词效果最好。WCO 每五年发布新版 HS，请关注海关的过渡公告。</p>` },
      ],
      faq: [
        { q: '怎么查我的商品的 HS 编码？', a: '在这里搜索商品名，选最接近的 6 位条目，再到目的国的关税工具确认 8–10 位的本国税号。归类取决于材质、用途和成分。' },
        { q: '各国的 HS 编码一样吗？', a: '只有前 6 位相同。欧盟 8 位，美国和中国 10 位，税率因国而异。' },
        { q: '可以直接用于报关吗？', a: '这是参考工具，归类由海关认定；重要货物请咨询持牌报关行或申请官方预裁定。' },
      ],
    },
  },

  {
    id: 'ustariff',
    slug: 'us-tariff-calculator',
    icon: '🇺🇸',
    updated: '2026-10-14',
    related: ['hs-code-lookup', 'eu-import-duty-vat-calculator', 'currency-converter'],
    en: {
      nav: 'US tariff',
      title: 'US Tariff & Duty Calculator: HTS Rate, Section 301, Total Duty',
      desc: 'Look up the US base duty rate for an HTS code from the official USITC schedule, add Section 301 duties by origin, and estimate total duty on your goods value.',
      h1: 'US Tariff & Duty Calculator',
      lead: 'Enter an HTS code, pick the country of origin and the goods value. See the base rate, Section 301 lines and an estimated total duty.',
      sections: [
        { h: 'What the calculator shows', body: `
          <ul>
            <li><b>Base (MFN / general) rate</b> from the official USITC Harmonized Tariff Schedule.</li>
            <li><b>Legacy Section 301 duties</b> linked to the code (China lists) from Chapter 99 provisions.</li>
            <li><b>New Section 301 rate</b> by origin, effective 2026-07-24, including the combined-cap rules for some partners.</li>
            <li><b>Estimated duty</b> = goods value × total ad-valorem rate.</li>
          </ul>` },
        { h: 'Rules that changed in 2026', body: `
          <p>The 2025 IEEPA (fentanyl and reciprocal) tariffs ended on 2026-02-24 after the Supreme Court ruling of 2026-02-20. The temporary Section 122 10% surcharge expired on 2026-07-24 and was replaced by new Section 301 duties. See our <a href="{{page:policy-updates}}">policy updates</a> page for what we track and when it was last reviewed.</p>` },
        { h: 'What it does not include', body: `
          <p>Anti-dumping and countervailing duties, Section 232 duties (steel, aluminium, copper, autos and others), per-unit (specific) duties, merchandise processing and harbour fees, and the many exemptions in the new 301 annexes are not calculated. Confirm with your customs broker before shipping.</p>` },
      ],
      faq: [
        { q: 'Where does the duty rate come from?', a: 'The base rate and Chapter 99 references come from the official USITC HTS search interface. Policy rates by origin come from our maintained rules table, shown with its as-of date.' },
        { q: 'Why is the total only an estimate?', a: 'AD/CVD, Section 232, specific duties, fees and exemptions are not included, and customs makes the final classification and valuation.' },
        { q: 'What HTS code length should I enter?', a: 'At least 6 digits. With 8–10 digits you get the exact national tariff line; with 6 digits you can pick from the lines under that prefix.' },
      ],
    },
    zh: {
      nav: '美国关税',
      title: '美国关税计算器：HTS 税率、301 条款、预估总关税',
      desc: '按 HTS 编码查询美国国际贸易委员会官方税则的基础税率，叠加各原产国 Section 301 税率，并按货值估算总关税。',
      h1: '美国关税查询与计算',
      lead: '输入 HTS 编码、选择原产国和货值，查看基础税率、301 条款和预估总关税。',
      sections: [
        { h: '工具会展示什么', body: `
          <ul>
            <li><b>基础（MFN / 普通）税率</b>，来自美国国际贸易委员会（USITC）官方税则。</li>
            <li><b>旧 Section 301 加征</b>（中国清单），来自该编码关联的 99 章条款。</li>
            <li><b>2026-07-24 起的新 Section 301 税率</b>，按原产国，含部分伙伴的合计上限规则。</li>
            <li><b>预估关税</b> = 货值 × 总从价税率。</li>
          </ul>` },
        { h: '2026 年变化的规则', body: `
          <p>2025 年的 IEEPA（芬太尼 / 对等关税）已于 2026-02-24 终止（最高法院 2026-02-20 裁决）；临时的 Section 122 10% 附加税已于 2026-07-24 到期，被新的 Section 301 取代。我们跟踪了哪些规则、最近一次复核是什么时候，见<a href="{{page:policy-updates}}">政策更新</a>页面。</p>` },
        { h: '没有包含的内容', body: `
          <p>反倾销 / 反补贴税、Section 232（钢铝铜、汽车等）、从量税、港口和商品处理费，以及新 301 附件中的大量豁免，都不在计算范围内。发货前请与报关行确认。</p>` },
      ],
      faq: [
        { q: '税率数据来自哪里？', a: '基础税率和 99 章引用来自 USITC 官方税则检索接口；各原产国的政策税率来自我们维护的规则表，并标注了更新日期。' },
        { q: '为什么总关税只是估算？', a: '反倾销/反补贴、232、从量税、各类费用和豁免未计入；归类与估价最终由海关认定。' },
        { q: 'HTS 编码要输入几位？', a: '至少 6 位。输入 8–10 位可得到精确税号；输入 6 位可从该前缀下的税号里选择。' },
      ],
    },
  },

  {
    id: 'eutariff',
    slug: 'eu-import-duty-vat-calculator',
    icon: '🇪🇺',
    updated: '2026-10-14',
    related: ['hs-code-lookup', 'us-tariff-calculator', 'currency-converter'],
    en: {
      nav: 'EU duty & VAT',
      title: 'EU Import Duty & VAT Calculator: Landed Cost to the European Union',
      desc: 'Estimate EU landed cost: customs duty, import VAT by member state and the €3 flat duty on low-value parcels, with one-click links to TARIC and Access2Markets.',
      h1: 'EU Import Duty & VAT Calculator',
      lead: 'Enter goods value, shipping, duty rate and destination country to estimate duty, import VAT and total landed cost. Jump to TARIC or Access2Markets with your code prefilled.',
      sections: [
        { h: 'How EU landed cost is estimated', body: `
          <ol>
            <li><b>Customs value</b> = goods value + shipping and insurance to the EU border.</li>
            <li><b>Duty</b> = customs value × duty rate (from TARIC for your CN code and origin).</li>
            <li><b>Import VAT</b> = (customs value + duty) × the destination member state\'s VAT rate.</li>
            <li><b>Landed cost</b> = goods + shipping + duty + VAT.</li>
          </ol>
          <p>For low-value B2C parcels up to €150, the tool applies the €3 flat customs duty introduced from 2026-07-01 as an interim measure, instead of the percentage duty.</p>` },
        { h: 'Standard VAT rates', body: `<p>The tool includes the standard VAT rate for each of the 27 member states (reference data, mid-2026). Reduced rates, special regimes and IOSS handling can change the result; check with your tax adviser.</p>` },
        { h: 'Where to confirm the duty rate', body: `<p>Use the TARIC and Access2Markets buttons: they open the official EU databases with your code and origin so you can read the exact rate, preferential terms and import conditions.</p>` },
      ],
      faq: [
        { q: 'Is import VAT charged on every shipment?', a: 'Import VAT generally applies to goods entering the EU. Rules differ for B2B, IOSS registration and low-value consignments; confirm with a tax adviser.' },
        { q: 'What is the €3 flat duty?', a: 'A temporary flat customs duty on low-value B2C parcels (up to €150) from 2026-07-01 until the EU customs data hub regime applies. The tool shows it when you tick the low-value option.' },
        { q: 'Does the tool use my HS code?', a: 'It uses it to build the TARIC and Access2Markets links. The duty percentage is entered by you after checking the official source.' },
      ],
    },
    zh: {
      nav: '欧盟关税 & VAT',
      title: '欧盟进口关税与 VAT 计算器：到岸成本估算',
      desc: '估算欧盟到岸成本：关税、各成员国进口增值税，以及 €150 以下包裹 €3 固定关税；一键跳转 TARIC 和 Access2Markets。',
      h1: '欧盟进口关税与 VAT 计算器',
      lead: '输入货值、运费、关税率和目的国，估算关税、进口 VAT 和到岸总成本；带着你的编码一键跳转 TARIC 或 Access2Markets。',
      sections: [
        { h: '欧盟到岸成本怎么估算', body: `
          <ol>
            <li><b>完税价格</b> = 货值 + 运至欧盟边境的运费和保险。</li>
            <li><b>关税</b> = 完税价格 × 关税率（在 TARIC 中按你的 CN 编码和原产国查询）。</li>
            <li><b>进口 VAT</b> = （完税价格 + 关税）× 目的国 VAT 税率。</li>
            <li><b>到岸成本</b> = 货值 + 运费 + 关税 + VAT。</li>
          </ol>
          <p>对 €150 以下的 B2C 低价值包裹，工具会按 2026-07-01 起实施的过渡措施，使用 €3 固定关税，而不是百分比关税。</p>` },
        { h: '标准 VAT 税率', body: `<p>工具内置欧盟 27 国的标准 VAT 税率（参考数据，2026 年中）。低税率、特殊制度和 IOSS 处理可能改变结果，请咨询税务顾问。</p>` },
        { h: '到哪里确认关税率', body: `<p>使用 TARIC 和 Access2Markets 按钮：会带着你的编码和原产国打开欧盟官方数据库，查看精确税率、优惠条款和进口条件。</p>` },
      ],
      faq: [
        { q: '每票货都要交进口 VAT 吗？', a: '进入欧盟的货物通常需要缴纳进口 VAT。B2B、IOSS 注册和低价值货物的规则不同，请与税务顾问确认。' },
        { q: '€3 固定关税是什么？', a: '2026-07-01 起对 €150 以下 B2C 低价值包裹实施的临时固定关税，直到欧盟海关数据中心制度生效。勾选低价值选项时工具会按此计算。' },
        { q: '工具会用我的 HS 编码吗？', a: '用来生成 TARIC 和 Access2Markets 链接。关税百分比由你在核对官方来源后输入。' },
      ],
    },
  },

  {
    id: 'postal',
    slug: 'postal-code-lookup',
    icon: '📮',
    updated: '2026-10-14',
    related: ['country-codes', 'volumetric-weight-calculator', 'time-zone-converter'],
    en: {
      nav: 'Postal code lookup',
      title: 'Postal Code Lookup: City & Region from ZIP / Postcode (80+ Countries)',
      desc: 'Enter a ZIP or postal code to get the place name, state or region and coordinates. Exact data for 80+ countries with an OpenStreetMap fallback for the rest.',
      h1: 'Postal Code Lookup',
      lead: 'Check that a customer\'s ZIP or postcode matches the city before you ship. Pick a country, type the code, see the place.',
      sections: [
        { h: 'Why validate postal codes', body: `
          <p>Wrong or mismatched postcodes cause delivery delays, address-correction fees and returns. A quick lookup catches typos before the label is printed.</p>` },
        { h: 'Formats to watch', body: `
          <ul>
            <li><b>US:</b> 5-digit ZIP (optionally ZIP+4). Many ZIPs start with 0 — keep the leading zero.</li>
            <li><b>UK:</b> alphanumeric postcodes such as <code>SW1A 1AA</code>, with a space before the last three characters.</li>
            <li><b>Canada:</b> <code>A1A 1A1</code> pattern.</li>
            <li><b>Netherlands, Poland, Portugal and others:</b> numeric codes with a fixed length and sometimes a hyphen or letters.</li>
          </ul>` },
        { h: 'Data sources and limits', body: `<p>Exact lookups come from a public postal-code dataset covering 80+ countries; other countries fall back to OpenStreetMap search. A postal code can cover several places, so treat the result as a sanity check, not an official address validation.</p>` },
      ],
      faq: [
        { q: 'Which countries are supported?', a: 'More than 80 countries have exact data; the rest use an OpenStreetMap fallback, which may return less precise results.' },
        { q: 'Can it validate a full street address?', a: 'No. It checks the postal code against the place name and region only.' },
        { q: 'Is my input stored?', a: 'Lookups are sent to the data provider through our proxy to avoid browser restrictions; we do not store the postal codes you enter. See the privacy policy.' },
      ],
    },
    zh: {
      nav: '邮编查地址',
      title: '邮编查地址：ZIP / Postcode 查城市和地区（80+ 国家）',
      desc: '输入邮编，得到地名、州/省和经纬度。80+ 国家有精确数据，其余国家回退到 OpenStreetMap。',
      h1: '邮编查地址',
      lead: '发货前核对买家邮编和城市是否匹配。选国家、输入邮编，看地名。',
      sections: [
        { h: '为什么要核对邮编', body: `
          <p>邮编错误或与城市不符会导致派送延误、地址修正费和退货。打印面单前快速查一下，可以挡住手误。</p>` },
        { h: '要注意的格式', body: `
          <ul>
            <li><b>美国：</b>5 位 ZIP（可带 ZIP+4）。很多 ZIP 以 0 开头，别丢掉前导零。</li>
            <li><b>英国：</b>字母数字混合，如 <code>SW1A 1AA</code>，最后三位前有空格。</li>
            <li><b>加拿大：</b><code>A1A 1A1</code> 格式。</li>
            <li><b>荷兰、波兰、葡萄牙等：</b>固定长度的数字码，有的带连字符或字母。</li>
          </ul>` },
        { h: '数据来源与限制', body: `<p>精确查询来自覆盖 80+ 国家的公开邮编数据集；其他国家回退到 OpenStreetMap 搜索。一个邮编可能覆盖多个地名，所以结果只作为合理性检查，不是官方地址验证。</p>` },
      ],
      faq: [
        { q: '支持哪些国家？', a: '80 多个国家有精确数据，其余使用 OpenStreetMap 回退，结果可能没那么精确。' },
        { q: '能验证完整街道地址吗？', a: '不能。只核对邮编与地名、地区是否匹配。' },
        { q: '我输入的内容会被保存吗？', a: '为避开浏览器限制，查询会通过我们的代理发给数据提供方；我们不保存你输入的邮编。详见隐私政策。' },
      ],
    },
  },

  {
    id: 'imgcompress',
    slug: 'image-resizer-for-marketplaces',
    icon: '🖼️',
    updated: '2026-10-14',
    related: ['hs-code-lookup', 'unit-converter', 'currency-converter'],
    en: {
      nav: 'Image resizer',
      title: 'Marketplace Image Resizer: Amazon, Temu, AliExpress, Shopee',
      desc: 'Resize product photos to exact marketplace sizes (Amazon, Temu, AliExpress, Shopee, TikTok Shop…) and keep each file under its size limit. Runs in your browser.',
      h1: 'Marketplace Image Resizer & Compressor',
      lead: 'Tick the marketplaces you sell on and drop in your photo. You get the exact pixel size and a file small enough for each platform. Images never leave your device.',
      sections: [
        { h: 'How it works', body: `
          <ol>
            <li>Choose a mode: <b>Marketplace presets</b> (exact size + size cap) or <b>Compress only</b> (keep original size, stay under a limit, default 2 MB).</li>
            <li>Tick one or more presets. <b>Pad</b> keeps the whole product and fills the canvas with white (or your colour); <b>Crop to fill</b> fills the frame.</li>
            <li>Drop images, paste a screenshot with Ctrl+V, or click to choose. Download each file or a ZIP with one folder per preset.</li>
          </ol>
          <p>Quality is chosen automatically: the highest setting that fits under the file-size cap, without changing the output pixel size. EXIF data, including GPS location, is removed from outputs.</p>` },
        { h: 'Reference sizes', body: `<p>Built-in sizes are reference values gathered from public seller guidance; platforms change rules often. See the <a href="{{page:image-size}}">image size requirements by marketplace</a> pages for each preset and note, and always confirm in your seller dashboard.</p>` },
        { h: 'Privacy', body: `<p>Processing happens locally in your browser using the canvas API. Nothing is uploaded to our servers.</p>` },
      ],
      faq: [
        { q: 'Are my images uploaded?', a: 'No. Resizing and compression run entirely in your browser.' },
        { q: 'Why does the free version limit batches?', a: 'The free tier handles a few images and presets per run. Pro unlocks larger batches and ZIP download.' },
        { q: 'Will quality drop?', a: 'The tool searches for the highest JPEG/WebP quality that fits under the limit and does not change the pixel size in preset mode. Extremely noisy images may need lower quality, and the result tells you when that happens.' },
        { q: 'Can I add my own preset?', a: 'Yes. Add a name, width, height and size limit; it is saved in your browser.' },
      ],
    },
    zh: {
      nav: '图片尺寸',
      title: '平台图片尺寸与压缩工具：亚马逊、Temu、速卖通、Shopee',
      desc: '把商品图调整到各平台的精确尺寸（亚马逊、沃尔玛、eBay、Temu、速卖通、Shopee、TikTok Shop、Lazada、Shopify），并把体积压到各平台上限以内。在浏览器本机处理。',
      h1: '平台图片尺寸与压缩工具',
      lead: '勾选你在售的平台，放入图片，得到每个平台精确的像素尺寸和够小的文件体积。图片不会离开你的设备。',
      sections: [
        { h: '怎么用', body: `
          <ol>
            <li>选择模式：<b>平台预设</b>（精确尺寸 + 体积上限）或<b>仅压缩</b>（保持原尺寸，限制体积，默认 2 MB）。</li>
            <li>勾选一个或多个预设。<b>补边</b>保留完整商品并用白色（或你选的颜色）补足画布；<b>居中裁切</b>填满画面。</li>
            <li>拖入图片、Ctrl+V 粘贴截图，或点击选择。可逐张下载，或下载按预设分文件夹的 ZIP。</li>
          </ol>
          <p>画质自动选择：在体积上限内取最高画质，预设模式下不改变输出像素尺寸。输出会去掉 EXIF（含拍摄位置）。</p>` },
        { h: '参考尺寸', body: `<p>内置尺寸是根据公开卖家指南整理的参考值，平台规则常变。每个预设及说明见<a href="{{page:image-size}}">各平台图片尺寸要求</a>，并请以卖家后台为准。</p>` },
        { h: '隐私', body: `<p>处理通过浏览器的 canvas 在本机完成，不会上传到我们的服务器。</p>` },
      ],
      faq: [
        { q: '图片会被上传吗？', a: '不会。缩放和压缩完全在你的浏览器里完成。' },
        { q: '为什么免费版限制批量？', a: '免费版每次处理少量图片和预设；Pro 解锁更大批量和 ZIP 下载。' },
        { q: '画质会下降吗？', a: '工具会找出体积上限内最高的 JPEG/WebP 画质，预设模式下不改变像素尺寸。噪点极多的图可能需要更低画质，结果里会明确提示。' },
        { q: '可以添加自己的预设吗？', a: '可以。填写名称、宽、高和体积上限，保存在你的浏览器里。' },
      ],
    },
  },
];

export const toolBySlug = Object.fromEntries(TOOLS.map((t) => [t.slug, t]));
export const toolById = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
