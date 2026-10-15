// Evergreen guides (EN primary, ZH secondary). Trusted HTML. Hedge carrier/regulator-specific claims.
export const GUIDES = [
  {
    slug: 'how-to-calculate-volumetric-weight',
    updated: '2026-10-14',
    tools: ['volumetric-weight-calculator', 'unit-converter'],
    en: {
      title: 'How to Calculate Volumetric Weight (with Examples)',
      desc: 'Step-by-step volumetric weight formula in cm/kg and in/lb, worked examples, rounding rules and how it affects shipping cost.',
      h1: 'How to Calculate Volumetric Weight',
      lead: 'A bulky, light parcel can cost more to ship than a small, heavy one. Volumetric weight is how carriers price that space.',
      body: `
        <h2>The formula</h2>
        <p class="formula">Volumetric weight (kg) = L × W × H (cm) ÷ divisor</p>
        <p>In inches and pounds: <code>L × W × H (in³) ÷ divisor = lb</code>, where common divisors are 139 or 166 in³ per pound.</p>
        <h2>Worked examples</h2>
        <ol>
          <li><b>Express parcel.</b> 50 × 40 × 30 cm, 6 kg actual, divisor 5000: 60,000 ÷ 5000 = 12 kg. Chargeable weight: <b>12 kg</b>.</li>
          <li><b>Dense carton.</b> 30 × 20 × 20 cm, 15 kg actual, divisor 5000: 12,000 ÷ 5000 = 2.4 kg. Chargeable weight: <b>15 kg</b> (actual is higher).</li>
          <li><b>Multiple pieces.</b> 10 cartons of 40 × 30 × 25 cm, divisor 6000: 30,000 ÷ 6000 = 5 kg each, <b>50 kg</b> in total, compared with the total actual weight.</li>
        </ol>
        <h2>Step by step</h2>
        <ol>
          <li>Measure the outside of the packed carton at its longest points, in the same unit.</li>
          <li>Multiply length × width × height.</li>
          <li>Divide by the divisor stated in your carrier\'s rate card.</li>
          <li>Compare with the actual weight; the larger one is the chargeable weight.</li>
          <li>Apply the carrier\'s rounding (some use 0.5 kg steps).</li>
        </ol>
        <h2>Common mistakes</h2>
        <ul>
          <li>Using the product size instead of the outside carton size.</li>
          <li>Mixing centimetres and inches.</li>
          <li>Forgetting that each carton is rated separately when a shipment has several.</li>
        </ul>
        <p>Skip the arithmetic with the <a href="{{tool:volumetric-weight-calculator}}">volumetric weight calculator</a>.</p>`,
      faq: [
        { q: 'Is volumetric weight the same as dimensional weight?', a: 'Yes. Volumetric weight, dimensional (DIM) weight and cubic weight all refer to the same idea.' },
        { q: 'Do I pay for volumetric weight or actual weight?', a: 'You pay for the greater of the two, called the chargeable weight.' },
      ],
    },
    zh: {
      title: '体积重怎么算（含示例）',
      desc: '体积重公式分步讲解：cm/kg 和 in/lb 两种算法、示例、进位规则，以及对运费的影响。',
      h1: '体积重怎么计算',
      lead: '又大又轻的包裹，运费可能比小而重的包裹还高。体积重就是承运商给“占用空间”定价的方式。',
      body: `
        <h2>公式</h2>
        <p class="formula">体积重（kg）= 长 × 宽 × 高（cm）÷ 系数</p>
        <p>英寸和磅：<code>长 × 宽 × 高（in³）÷ 系数 = lb</code>，常见系数为每磅 139 或 166 立方英寸。</p>
        <h2>示例</h2>
        <ol>
          <li><b>快递包裹。</b>50 × 40 × 30 cm，实重 6 kg，系数 5000：60,000 ÷ 5000 = 12 kg，计费重量 <b>12 kg</b>。</li>
          <li><b>高密度纸箱。</b>30 × 20 × 20 cm，实重 15 kg，系数 5000：12,000 ÷ 5000 = 2.4 kg，计费重量 <b>15 kg</b>（实重更大）。</li>
          <li><b>多件。</b>10 箱，每箱 40 × 30 × 25 cm，系数 6000：30,000 ÷ 6000 = 每箱 5 kg，共 <b>50 kg</b>，再与总实重比较。</li>
        </ol>
        <h2>分步计算</h2>
        <ol>
          <li>用同一单位，量包装好的纸箱外尺寸（取最长处）。</li>
          <li>长 × 宽 × 高。</li>
          <li>除以承运商报价单里写明的系数。</li>
          <li>与实际重量比较，取较大者为计费重量。</li>
          <li>按承运商规则进位（有的按 0.5 kg 一档）。</li>
        </ol>
        <h2>常见错误</h2>
        <ul>
          <li>用了商品尺寸而不是外箱尺寸。</li>
          <li>厘米和英寸混用。</li>
          <li>多箱发货时，每一箱要分别计算。</li>
        </ul>
        <p>想省掉计算，用<a href="{{tool:volumetric-weight-calculator}}">体积重计算器</a>。</p>`,
      faq: [
        { q: '体积重和材积重一样吗？', a: '一样。体积重、材积重、DIM 重说的是同一个概念。' },
        { q: '按体积重还是实重收费？', a: '按两者中较大的一个，也就是计费重量。' },
      ],
    },
  },

  {
    slug: 'volumetric-weight-divisors',
    updated: '2026-10-14',
    tools: ['volumetric-weight-calculator'],
    en: {
      title: 'Volumetric Weight Divisors Explained: 5000, 6000, 4000, 139, 166',
      desc: 'What each volumetric weight divisor means, where it is commonly used (express, air, sea, US domestic) and how to confirm yours with a carrier.',
      h1: 'Volumetric Weight Divisors Explained',
      lead: 'The divisor decides how expensive your bulky cargo is. A larger divisor is friendlier to light, bulky goods.',
      body: `
        <p>Divisors vary by carrier, service and contract, and they change. The table lists the values built into our calculator and where they are typically seen. <b>Always confirm with your rate card.</b></p>
        <table class="tbl">
          <thead><tr><th>Divisor</th><th>Unit</th><th>Typically seen on</th><th>1 m³ equals</th></tr></thead>
          <tbody>
            <tr><td>5000</td><td>cm³ / kg</td><td>International express (e.g. DHL, FedEx, UPS, TNT services)</td><td>200 kg</td></tr>
            <tr><td>6000</td><td>cm³ / kg</td><td>Air freight, EMS and many international lines</td><td>167 kg</td></tr>
            <tr><td>4000</td><td>cm³ / kg</td><td>Some air freight or special lines</td><td>250 kg</td></tr>
            <tr><td>8000</td><td>cm³ / kg</td><td>Some economy lines</td><td>125 kg</td></tr>
            <tr><td>1000</td><td>kg per m³</td><td>Sea LCL (1 CBM = 1,000 kg)</td><td>1,000 kg</td></tr>
            <tr><td>139</td><td>in³ / lb</td><td>US domestic services of some carriers</td><td>≈ 439 lb</td></tr>
            <tr><td>166</td><td>in³ / lb</td><td>International and some postal services</td><td>≈ 368 lb</td></tr>
          </tbody>
        </table>
        <h2>How to read a divisor</h2>
        <p>With divisor 5000, every 5,000 cm³ of space is billed like 1 kg. A 1 m³ pallet is 1,000,000 cm³, so it is billed like 200 kg even if it is lighter.</p>
        <h2>How to confirm yours</h2>
        <ul>
          <li>Check the volumetric rule in your rate card or service terms.</li>
          <li>Ask your account manager or forwarder which divisor and rounding apply to each service.</li>
          <li>Compare two services with the <a href="{{tool:volumetric-weight-calculator}}">calculator</a>: switch the divisor and see the chargeable weight change.</li>
        </ul>`,
      faq: [
        { q: 'Is 5000 always the divisor for express?', a: 'No. It is common, but services and contracts differ. Use the divisor in your own rate card.' },
        { q: 'Why is the sea divisor 1000?', a: 'For LCL, one cubic metre is commonly treated as one tonne (1,000 kg) when comparing volume with weight.' },
      ],
    },
    zh: {
      title: '体积重系数详解：5000、6000、4000、8000、1000、139、166',
      desc: '每个体积重系数的含义、常见使用场景（快递、空运、海运、美国国内）以及如何向承运商确认。',
      h1: '体积重系数详解',
      lead: '系数决定了你的轻抛货有多贵。系数越大，对“又轻又大”的货越友好。',
      body: `
        <p>系数因承运商、服务和合同而异，也会调整。下表是本计算器内置的数值和常见使用场景，<b>请务必以你的报价单为准</b>。</p>
        <table class="tbl">
          <thead><tr><th>系数</th><th>单位</th><th>常见场景</th><th>1 m³ 相当于</th></tr></thead>
          <tbody>
            <tr><td>5000</td><td>cm³ / kg</td><td>国际快递（如 DHL、FedEx、UPS、TNT 的服务）</td><td>200 kg</td></tr>
            <tr><td>6000</td><td>cm³ / kg</td><td>空运、EMS 及多数国际专线</td><td>167 kg</td></tr>
            <tr><td>4000</td><td>cm³ / kg</td><td>部分空运或专线</td><td>250 kg</td></tr>
            <tr><td>8000</td><td>cm³ / kg</td><td>部分经济类专线</td><td>125 kg</td></tr>
            <tr><td>1000</td><td>kg / m³</td><td>海运拼箱（1CBM = 1000kg）</td><td>1,000 kg</td></tr>
            <tr><td>139</td><td>in³ / lb</td><td>部分承运商的美国国内服务</td><td>≈ 439 lb</td></tr>
            <tr><td>166</td><td>in³ / lb</td><td>国际及部分邮政服务</td><td>≈ 368 lb</td></tr>
          </tbody>
        </table>
        <h2>怎么理解系数</h2>
        <p>系数 5000 表示每 5,000 cm³ 的空间按 1 kg 计费。1 m³ 的托盘是 1,000,000 cm³，即使更轻也按约 200 kg 计费。</p>
        <h2>如何确认你的系数</h2>
        <ul>
          <li>查看报价单或服务条款里的体积重规则。</li>
          <li>向客户经理或货代确认每种服务适用的系数和进位。</li>
          <li>用<a href="{{tool:volumetric-weight-calculator}}">计算器</a>对比两种服务：切换系数，看计费重量变化。</li>
        </ul>`,
      faq: [
        { q: '快递的系数一定是 5000 吗？', a: '不一定。5000 很常见，但服务和合同不同，请以你自己的报价单为准。' },
        { q: '海运为什么用 1000？', a: '拼箱（LCL）比较体积和重量时，常把 1 立方米视作 1 吨（1000 kg）。' },
      ],
    },
  },

  {
    slug: 'how-to-find-hs-code',
    updated: '2026-10-14',
    tools: ['hs-code-lookup', 'us-tariff-calculator', 'eu-import-duty-vat-calculator'],
    en: {
      title: 'How to Find the HS Code for Your Product (6-Step Method)',
      desc: 'A practical method to find and verify an HS / HTS / CN code: identify the product, search, read the notes, check national tariff lines, and document your decision.',
      h1: 'How to Find the HS Code for Your Product',
      lead: 'Getting the code right avoids delays, penalties and wrong duty estimates. Here is a method sellers can follow.',
      body: `
        <ol>
          <li><b>Describe the product precisely.</b> Material, function, who uses it, how it is sold (set or single), and any processing. Two products that look similar can sit in different headings.</li>
          <li><b>Search by name.</b> Use the <a href="{{tool:hs-code-lookup}}">HS code lookup</a> in English or Chinese and note the closest 6-digit entries.</li>
          <li><b>Read the chapter and heading notes.</b> Notes often exclude items and point to a different chapter (for example, electronics versus toys).</li>
          <li><b>Check the national lines.</b> Open the <a href="{{tool:us-tariff-calculator}}">US tariff</a> or <a href="{{tool:eu-import-duty-vat-calculator}}">EU</a> tool with your 6-digit code to see the 8–10 digit lines and duty rates.</li>
          <li><b>Compare with similar listings and past shipments.</b> Look at what your supplier or forwarder used, but do not copy blindly.</li>
          <li><b>Document the reasoning.</b> Keep product specs and the rule you applied. For high-value or uncertain goods, ask a licensed customs broker or apply for a binding ruling.</li>
        </ol>
        <h2>Why 6 digits are not enough</h2>
        <p>The international HS stops at 6 digits. Duty rates, statistical suffixes and many import conditions are set at the national level: 8 digits in the EU, 10 digits in the US and China.</p>
        <h2>Typical pitfalls</h2>
        <ul>
          <li>Wireless headsets with extra data functions may fall under a different subheading from basic headphones.</li>
          <li>Sets sold together are classified by the rules for sets (essential character), not item by item.</li>
          <li>Parts and accessories often have their own headings.</li>
        </ul>`,
      faq: [
        { q: 'Who decides the final HS code?', a: 'The customs authority of the importing country. You declare a code; customs may accept or change it.' },
        { q: 'What if two codes seem possible?', a: 'Apply the General Rules of Interpretation, check the notes, and consider a binding ruling from the customs authority.' },
      ],
    },
    zh: {
      title: '怎么查商品的 HS 编码（六步法）',
      desc: '查找并核实 HS / HTS / CN 编码的实用方法：描述商品、搜索、阅读注释、核对各国税号、记录判断依据。',
      h1: '怎么查商品的 HS 编码',
      lead: '编码选对，才能避免延误、罚款和错误的关税估算。下面是卖家可以照做的方法。',
      body: `
        <ol>
          <li><b>精确描述商品。</b>材质、功能、使用对象、销售形态（套装还是单件）、是否加工。看起来相似的商品可能在不同品目。</li>
          <li><b>按名称搜索。</b>用<a href="{{tool:hs-code-lookup}}">HS 编码查询</a>，中英文都行，记下最接近的 6 位条目。</li>
          <li><b>阅读章、品目注释。</b>注释常常排除某些商品并指向其他章（例如电子产品与玩具）。</li>
          <li><b>核对各国税号。</b>带着 6 位编码打开<a href="{{tool:us-tariff-calculator}}">美国关税</a>或<a href="{{tool:eu-import-duty-vat-calculator}}">欧盟</a>工具，查看 8–10 位税号和税率。</li>
          <li><b>对照同类商品和历史报关。</b>参考供应商或货代使用的编码，但不要盲目照抄。</li>
          <li><b>记录判断依据。</b>保存商品规格和适用的规则。金额大或拿不准时，咨询持牌报关行或申请预裁定。</li>
        </ol>
        <h2>为什么只有 6 位不够</h2>
        <p>国际通用的 HS 到 6 位为止。关税率、统计后缀和很多进口条件在各国层面设定：欧盟 8 位，美国和中国 10 位。</p>
        <h2>常见坑</h2>
        <ul>
          <li>带额外数据功能的无线耳机，可能与普通耳机归在不同子目。</li>
          <li>成套销售的商品按“套装”规则（以主要特征归类），而不是逐件归类。</li>
          <li>零部件和配件常有自己的品目。</li>
        </ul>`,
      faq: [
        { q: '最终由谁决定 HS 编码？', a: '进口国海关。你申报一个编码，海关可能接受也可能更改。' },
        { q: '两个编码都说得通怎么办？', a: '应用归类总规则，查看注释，并考虑向海关申请预裁定。' },
      ],
    },
  },

  {
    slug: 'landed-cost-formula',
    updated: '2026-10-14',
    tools: ['eu-import-duty-vat-calculator', 'us-tariff-calculator', 'currency-converter'],
    en: {
      title: 'Landed Cost Formula for Cross-border Sellers (Duty, VAT, Freight)',
      desc: 'How to calculate landed cost: product cost, freight, insurance, customs duty, import VAT and fees, with an EU worked example.',
      h1: 'Landed Cost Formula for Cross-border Sellers',
      lead: 'Landed cost is the real cost of getting a product to the customer\'s country. Price from it, not from the factory price.',
      body: `
        <p class="formula">Landed cost = product + freight + insurance + duty + import VAT (if not recoverable) + brokerage and fees</p>
        <h2>EU worked example</h2>
        <p>Goods €1,000, shipping €100, duty rate 4%, destination VAT 21%.</p>
        <ul>
          <li>Customs value = 1,000 + 100 = €1,100</li>
          <li>Duty = 1,100 × 4% = €44</li>
          <li>VAT base = 1,100 + 44 = €1,144; VAT = 1,144 × 21% = €240.24</li>
          <li>Landed cost = 1,000 + 100 + 44 + 240.24 = <b>€1,384.24</b> (VAT may be recoverable for VAT-registered businesses)</li>
        </ul>
        <p>Try your own numbers in the <a href="{{tool:eu-import-duty-vat-calculator}}">EU import duty & VAT calculator</a>.</p>
        <h2>US notes</h2>
        <p>US duty is applied on the customs value using the HTS rate plus any additional duties by origin. The <a href="{{tool:us-tariff-calculator}}">US tariff calculator</a> estimates the ad-valorem part; AD/CVD, Section 232 and fees are separate.</p>
        <h2>Don\'t forget</h2>
        <ul>
          <li>Customs brokerage, terminal and handling fees.</li>
          <li>Currency-conversion costs: see the <a href="{{tool:currency-converter}}">currency converter</a> with a fee.</li>
          <li>Returns and last-mile delivery for B2C.</li>
        </ul>`,
      faq: [
        { q: 'Is import VAT part of landed cost?', a: 'It is a cash cost at import. If you are VAT-registered and can reclaim it, it is not a final cost, but it still affects cash flow.' },
        { q: 'What is the customs value?', a: 'Usually the transaction value plus freight and insurance to the border of the importing country; rules vary by country.' },
      ],
    },
    zh: {
      title: '到岸成本公式（关税、VAT、运费）：跨境卖家指南',
      desc: '如何计算到岸成本：货值、运费、保险、关税、进口 VAT 和各项费用，附欧盟示例。',
      h1: '跨境卖家的到岸成本公式',
      lead: '到岸成本是把商品送到买家所在国的真实成本。定价要从它出发，而不是出厂价。',
      body: `
        <p class="formula">到岸成本 = 货值 + 运费 + 保险 + 关税 + 进口 VAT（若不可抵扣）+ 报关及各项费用</p>
        <h2>欧盟示例</h2>
        <p>货值 €1,000，运费 €100，关税率 4%，目的国 VAT 21%。</p>
        <ul>
          <li>完税价格 = 1,000 + 100 = €1,100</li>
          <li>关税 = 1,100 × 4% = €44</li>
          <li>VAT 计税基数 = 1,100 + 44 = €1,144；VAT = 1,144 × 21% = €240.24</li>
          <li>到岸成本 = 1,000 + 100 + 44 + 240.24 = <b>€1,384.24</b>（已注册 VAT 的企业进口 VAT 通常可抵扣）</li>
        </ul>
        <p>用<a href="{{tool:eu-import-duty-vat-calculator}}">欧盟关税与 VAT 计算器</a>代入你自己的数字。</p>
        <h2>美国说明</h2>
        <p>美国关税按完税价格，用 HTS 税率加按原产国的附加关税计算。<a href="{{tool:us-tariff-calculator}}">美国关税计算器</a>估算从价部分；反倾销/反补贴、232 和各类费用另计。</p>
        <h2>别忘了</h2>
        <ul>
          <li>报关费、码头和操作费。</li>
          <li>汇兑成本：用带手续费的<a href="{{tool:currency-converter}}">汇率换算器</a>估算。</li>
          <li>B2C 的退货与末端派送。</li>
        </ul>`,
      faq: [
        { q: '进口 VAT 算到岸成本吗？', a: '它是进口时的现金支出。若你已注册 VAT 并可抵扣，则不是最终成本，但仍影响现金流。' },
        { q: '什么是完税价格？', a: '通常是成交价加上运至进口国边境的运费和保险；各国规则不同。' },
      ],
    },
  },
];
export const guideBySlug = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
