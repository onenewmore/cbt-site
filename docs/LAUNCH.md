# 上线指南：网站版 + Pro 订阅 + 联盟/线索

> 读这份文档前先看第 0 节。里面列了**我没能核实、必须你在沙盒里自己验证**的东西。

---

## 0. 先说清楚：已验证 / 未验证

### 已验证（有自动化测试）

| 范围 | 怎么验证的 |
|---|---|
| 静态站：124 页（中英各 62），hreflang 成对互指、canonical、JSON-LD 可解析、sitemap 与 noindex 一致、内链无断链、无薄内容页、无泄露的模板变量 | `tests/build.test.mjs`（11 项） |
| Worker：登录魔法链接（单次使用、15 分钟）、会话、Paddle 签名校验/幂等/乱序、取消后停用、API Key 轮换与配额限流、线索校验/蜜罐/去重/限流/Turnstile、管理端导出与删除、`/go/` 跳转、统计入口、关注清单 cron | `tests/worker.test.mjs`（30 项，内存 KV） |
| 浏览器端到端：10 个工具在真实 Chromium 里挂载并算对（体积重 4.8、美国关税 37.5%、邮编、汇率走同源代理）、中文页、免费版限制与付费墙、Pro 开通→登录→API Key→导出 CSV/ZIP/批量、报价表单与候补名单、回访统计 | `tests/e2e_site.py`（60 项）+ `tests/smoke_site.py`（44 页无控制台错误） |

运行：`npm test`（单测）、`npm run test:e2e`（浏览器端到端，需要 Playwright + Chromium）。

### 没有验证（必须你做）

1. **Paddle 的 API 与 webhook 细节**。我无法访问 Paddle 文档（抓取被拒），代码是按我对 Paddle Billing 的了解写的：
   - webhook 头 `Paddle-Signature: ts=…;h1=…`，签名内容 `ts:原始请求体`，HMAC-SHA256；
   - 事件名 `subscription.created/activated/updated/canceled/past_due/paused/resumed`；
   - 订阅对象字段 `status`、`customer_id`、`current_billing_period.ends_at`、`scheduled_change`、`billing_cycle.interval`；
   - 用 `GET /customers/{id}` 取邮箱，用 `POST /customers/{id}/portal-sessions` 取客户门户链接（`data.urls.general.overview`）；
   - Paddle.js v2 的 `Environment.set('sandbox')`、`Initialize({token})`、`Checkout.open({items, settings, customData})`、事件 `checkout.completed`。
   
   **怎么验：在 Paddle 沙盒里走一遍完整流程**（第 4 节），重点看：webhook 到了没有、`/api/pro/me` 是否变成 pro、门户按钮能否打开、取消后是否停用。字段对不上，改的地方只有 `worker/src/paddle.mjs` 和 `worker/src/entitlement.mjs`，对应测试在 `tests/worker.test.mjs`。
2. **Cloudflare 配置细节**：`wrangler.jsonc` 里的 `assets.run_worker_first`（数组写法）、`not_found_handling`、`analytics_engine_datasets`、`triggers.crons`，以及静态资源是否读取 `dist/_headers`（安全响应头、缓存头），都是按我的了解写的，首次 `wrangler deploy` 如果报配置错误，以官方文档为准调整。
3. **第三方数据的使用条款**（见第 9 节）：汇率源、Nominatim、USITC HTS 用于**收费 API** 和**高流量**时是否允许，我没有核实，必须你读条款。
4. **合作方**：我没有预置任何货代/海外仓/VAT/报关行/支付工具的名称、佣金或链接。`config/partners.json` 里所有 `partners` 都是空的。
5. **法律文本**（隐私政策、条款、退款、联盟披露）是通用模板，不是法律意见；上线前请你或律师按你的主体和目标市场过一遍。
6. 没有在真实 Cloudflare 环境、真实 Paddle 账号、真实邮件服务上跑过。

---

## 1. 目录结构

```
cbt-site/
  config/site.config.json    品牌、价格展示、免费/Pro 额度、Paddle 配置（占位）
  config/partners.json       联盟伙伴（全空）、类别、工具→类别映射
  data/policy-updates.json   政策更新记录（政策页 + Pro 邮件摘要共用）
  content/                   工具/指南/界面文案与法务文本（中英）
  src/                       静态站生成器（Node，无依赖）
  assets/                    CSS、站点脚本（统计/门控/定价/账户/批量/导出/线索）
  worker/                    Cloudflare Worker：API、登录、Paddle webhook、线索、跳转、统计、cron
  scripts/dev.mjs            本地开发服务器（真 Worker + 内存 KV + 模拟第三方）
  tests/                     单测 + 浏览器端到端
  docs/                      本文档、ANALYTICS.md
  dist/                      构建产物（由 build 生成）
```

工具本身直接复用 Chrome 插件 `../cbt-toolkit/js` 的代码：构建时复制一份并打补丁（`src/lib/patches.mjs`，每个补丁都断言锚点存在，插件代码变了会让构建报错而不是悄悄失效）。**插件源码没有被改动。** 默认从 `../cbt-toolkit` 读取，可用 `EXT_DIR=/path` 指定。

## 2. 本地运行

```bash
cd cbt-site
npm run build          # 生成 dist/（会列出警告：占位符、siteUrl）
npm run dev            # http://localhost:8787 ，第三方数据与 Paddle 客户接口默认是模拟的
npm test               # 单测
npm run test:e2e       # 浏览器端到端
```

开发服务器里的 `/__dev/outbox`（看"发出"的邮件）、`/__dev/subscribe`（模拟已签名的 Paddle webhook）只存在于 `scripts/dev.mjs`，不在 Worker 里。

## 3. 上线前要填的占位符

| 占位符 | 在哪 | 说明 |
|---|---|---|
| `siteUrl` | 构建时 `SITE_URL=` 环境变量；Worker 的 `vars.SITE_URL` | **两处必须一致**，canonical、sitemap、登录邮件链接都用它 |
| `{{COMPANY_NAME}}` | `COMPANY_NAME=` | 出现在隐私政策、条款、页脚 |
| `{{CONTACT_EMAIL}}` | `CONTACT_EMAIL=` | **会公开显示**，请用业务邮箱 |
| `{{GOVERNING_LAW}}` | `GOVERNING_LAW=` | 条款里的适用法律，如 "the laws of Hong Kong"，请咨询律师 |
| `extensionUrl` | `config/site.config.json` | 插件上架后的 Chrome 商店链接 |
| Paddle 令牌与价格 ID | `PADDLE_CLIENT_TOKEN` `PADDLE_ENV` `PADDLE_PRICE_MONTHLY` `PADDLE_PRICE_ANNUAL` | 见第 4 节；**不填则定价页自动变成"候补名单"**，不会出现坏掉的结账按钮 |
| `og.png` | `assets/img/og.png` | 已生成 1200×630 占位图，可换成你自己的 |

生产构建（有警告就失败，防止带着占位符上线）：

```bash
SITE_URL=https://你的域名 COMPANY_NAME="你的主体" CONTACT_EMAIL=support@你的域名 \
GOVERNING_LAW="the laws of …" PADDLE_ENV=production PADDLE_CLIENT_TOKEN=… \
PADDLE_PRICE_MONTHLY=pri_… PADDLE_PRICE_ANNUAL=pri_… npm run build:prod
```

定价页显示的金额来自 `config/site.config.json` 的 `pricing`（目前 $9 / $79，是**占位定价，不是调研结论**）；实际扣款金额由 Paddle 里的价格决定。**两处必须手动保持一致。**

## 4. Paddle（收款 + 代收代缴税）

1. 注册 Paddle Billing 账号。**先用沙盒**（独立的账号体系、独立的密钥/令牌/价格/webhook）。
2. 沙盒里创建产品 "Pro" 和两个价格（月付、年付），记下 `pri_…`。
3. Developer Tools：
   - 创建**客户端令牌**（前端用，`PADDLE_CLIENT_TOKEN`）；
   - 创建**服务端 API Key**（`wrangler secret put PADDLE_API_KEY`）；
   - 创建**通知目的地**：URL `https://你的域名/api/paddle/webhook`，订阅所有 `subscription.*` 事件，复制它的密钥（`wrangler secret put PADDLE_WEBHOOK_SECRET`）。
4. 沙盒里用测试卡走完整流程，逐项确认：
   - [ ] 点"开通 Pro"弹出结账；完成后跳回 `/account/?checkout=success`
   - [ ] webhook 返回 200，欢迎邮件到达（含登录链接）
   - [ ] 账户页显示 Pro、周期结束日期正确
   - [ ] "管理账单"能打开 Paddle 客户门户
   - [ ] 在门户取消 → 状态变成 `cancelAtPeriodEnd`，到期后失去 Pro
   - [ ] 续费失败（沙盒模拟）→ `past_due` 有 7 天宽限
5. Paddle 上线审核：他们会看你的网站、条款、隐私政策、退款政策——这些页面都已生成，填好占位符后再提交。具体审核要求、费率、支持的国家和禁售类目，**以 Paddle 官网当前说明为准**。
6. 切生产：重复第 3 步（生产环境的新令牌/密钥/webhook），`PADDLE_ENV=production`，重新构建并部署。

税务：用 Paddle 这类 Merchant of Record，销售税/VAT 由 Paddle 作为销售方计算、收取、申报。你的税务义务（所得税、主体合规等）仍然在你自己，**不是"省掉所有税务"**，请咨询会计。

**Pro 权益 = 这几样（见 `config/site.config.json`）**
| 功能 | 免费 | Pro | 谁来强制 |
|---|---|---|---|
| 单项计算/查询 | 全部 | 全部 | — |
| 图片压缩 | 每次 3 张 × 3 个预设，无 ZIP | 不限 + ZIP | 浏览器（可绕过） |
| 批量 CSV（体积重/汇率/HS） | 预览前 5 行 | 5,000 行 + 导出 CSV | 浏览器（可绕过） |
| 结果导出 CSV | 否 | 是 | 浏览器（可绕过） |
| **API** | 否 | 20,000 次/月，60 次/分钟 | **服务端** |
| **政策提醒**（HTS 税率变化邮件 + 政策摘要） | 否 | 20 个税号 | **服务端** |

### ⚠️ 需要你决定的一件事

浏览器里的限制（图片批量、批量行数、导出）**懂技术的用户可以绕过**，而且 **Chrome 插件里的图片批量目前仍是免费不限量**。真正由服务端强制、没法绕过的 Pro 价值只有 **API** 和 **政策提醒**。三个选项：

1. **接受**：把 Pro 的定位放在"API + 提醒 + 省事的批量导出"，不指望靠限制逼人付费。
2. **给插件下一版（1.3）也加同样的免费额度**——但插件已是免费发布的，收紧功能会影响现有用户和评分，先看数据再决定。
3. **把批量/导出也搬到服务端**（Worker 里算）——成本和复杂度上升，只在确认有人愿意付费后做。

统计里 `limit_hit`（谁撞到了限制）和 `pro_cta → checkout_open → checkout_complete` 就是用来做这个决定的。


### 微信支付 / 支付宝：一年通行证（一次性付款）

Paddle 的微信支付只支持**一次性商品**，不支持订阅（见 Paddle 开发者文档 WeChat Pay 更新说明）。所以另设一个一次性价格：

1. 在 Paddle 里新建一个**一次性**价格（不设 billing cycle），金额与 `config/site.config.json` 的 `pricing.pass` 一致（默认 $79）。
2. 把价格 ID 填到 `paddle.prices.pass`（或构建变量 `PADDLE_PRICE_PASS`），定价页会自动多出"一年通行证"选项。
3. 在 Paddle → Checkout → Checkout configuration 里打开 WeChat Pay 和 Alipay。
4. Webhook 需要订阅 `transaction.completed` 事件。收到该价格的成交后，给买家 365 天 Pro；提前续买会顺延，不会丢天数；同一笔交易重复推送只算一次。
5. 字段名（`subscription_id`、`items[].price.id`）按 Paddle 交易对象编写，**未在沙盒实测**，上线前请用沙盒走一遍。

加密货币：Paddle 不支持，本项目没有接入，原因见对话记录（税务代收失效、无法自动续费、中国大陆对虚拟货币交易有监管限制）。

## 5. Cloudflare 部署

1. 域名接入 Cloudflare。
2. 创建 KV 命名空间：`npx wrangler kv namespace create CBT_KV`，把返回的 id 填进 `worker/wrangler.jsonc`。
3. 填 `wrangler.jsonc` 的 `vars`（`SITE_URL`、`MAIL_FROM`、`PADDLE_ENV`、`LEAD_NOTIFY_EMAIL` 等）。
4. 设置密钥（不要写进文件）：
   ```bash
   cd worker
   npx wrangler secret put SESSION_SECRET        # 随机长字符串：openssl rand -hex 32
   npx wrangler secret put PADDLE_WEBHOOK_SECRET
   npx wrangler secret put PADDLE_API_KEY
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put ADMIN_TOKEN           # 线索导出/删除用，随机长字符串
   # 可选：TURNSTILE_SECRET、LEADS_WEBHOOK_URL
   ```
5. 部署：`npm run deploy`。完成后访问 `/api/health` 看各项 `configured` 是否为 true。
6. 路由：在 Cloudflare 里把域名绑定到这个 Worker（自定义域名）。
7. **套餐**：Workers/KV 的免费额度对这个项目偏紧（KV 写入有每日上限；每次 API 调用、每次登录、每次线索都会写 KV；cron 每天也要发起大量子请求）。**建议直接用 Workers Paid**，具体额度以官网为准。
8. 在 Cloudflare 的 WAF/速率限制里给 `/api/*` 加一条基础限速规则（Worker 内的限流对高流量只是尽力而为）。
9. 邮件：在 Resend 验证你的发信域名（SPF/DKIM），`MAIL_FROM` 要用该域名。

## 6. SEO：怎么让它真的有自然流量

已做：
- 每个工具独立页面，中英各一页；英文无前缀、中文 `/zh/`；英文为 x-default；
- 每页：唯一标题/描述、canonical、hreflang、Open Graph、JSON-LD（WebApplication、FAQPage、BreadcrumbList、Article、WebSite/Organization）、sitemap 含 hreflang 备用链接；
- 内容页：10 个工具页（说明 + FAQ）、9 个平台图片尺寸页（×2 语言）、17 个 HS 章节页、体积重系数/单位等指南、政策更新页；
- **质量优先的程序化页面**：HS 章节参考条目少于 6 条的**不生成独立页**（47 个有条目的章节里只保留 17 个），避免薄内容；按 HS6 逐条生成几千页的做法被我刻意放弃；
- 所有数据页标注"更新至某日期"。

你要做：
1. Search Console：添加域名资源 → 提交 `https://你的域名/sitemap.xml`；Bing Webmaster Tools 同理。
2. 用 Google 的富媒体结果测试抽查几个页面的结构化数据。
3. 把工具页作为主要落地页做外链/社区分享；插件商店页链接到网站（`extensionUrl` 反向也要填）。
4. 内容更新是持续成本：图片平台规格、美国 301 / 欧盟 €3 关税、HS 条目变化时，改 `data/policy-updates.json`、`config`/内容，更新 `lastmod`，重新部署。**每次改 `policy-updates.json` 后部署，Pro 用户会在次日 cron 里收到摘要邮件。**
5. 自然流量需要时间。看趋势，不要期望几周内有明显数字；我没有可引用的行业基准，所以文档里没有"达标线"，请先建立你自己的基线（见 `docs/ANALYTICS.md`）。
6. 中文版面向使用 Google/Bing 的中文用户。Cloudflare 全球节点在中国大陆的访问速度和百度收录**没有做任何处理**（百度通常需要 ICP 备案），如果主要受众在大陆，请单独评估。

## 7. 统计和回访率

见 `docs/ANALYTICS.md`：事件表、指标定义（自然流量、回访率按访问计算且是下限）、9 条可直接用的 SQL。要点：无 Cookie、不存 IP/UA；Analytics Engine 数据保留期有限，**每月导出存档**。

## 8. 联盟与线索

### 页面上已经有的
- 工具页下方的"下一步"推荐位（按工具映射类别，`config/partners.json` 的 `toolMap`）：体积重 → 货代/海外仓；汇率 → 支付工具；HS → 报关行；美国关税 → 报关行/货代；欧盟关税 → VAT 申报/报关行；邮编 → 海外仓/货代。
- `/get-quotes/` 中心页 + 5 个类别页的报价表单（含明示同意、蜜罐、可选 Turnstile、限流、去重）。
- Pro 候补名单复用同一线索接口。
- 联盟披露页，推荐位旁有披露文字；联盟链接一律 `rel="sponsored nofollow noopener"`，并标注"赞助"。

### 没有伙伴时
推荐位只显示"获取报价"按钮（导向你自己的表单），**不显示任何虚构的伙伴**。线索进入你的 KV，你自己决定转给谁。

### 接入真实伙伴（你要做的）
1. 自己去申请对应类别的联盟/推荐计划（货代、海外仓、VAT 申报、报关行、支付工具），拿到**追踪链接**和**佣金条款**。我没有预置任何名称或数字，也不能替你估算佣金。
2. 在 `config/partners.json` 对应类别的 `partners` 里加：
   ```json
   {
     "id": "your-partner-id",
     "name": "伙伴名称",
     "url": "https://伙伴的追踪链接?sub={src}&click={click}",
     "blurb": { "en": "…", "zh": "…" },
     "disclosure": { "en": "We earn a referral fee if you sign up.", "zh": "如果你注册，我们会获得推荐费。" }
   }
   ```
   `{src}`（来自哪个工具页）和 `{click}`（每次点击的随机 id）会在 `/go/<id>` 跳转时替换；没有对应参数的伙伴就不要写。
3. 重新构建并部署。点击会走 `/go/<id>?src=…`，服务端记录 `affiliate_redirect`（以它为准）。
4. 披露：美国 FTC、英国 ASA 等对推荐关系的披露有明确要求，本站默认做法（赞助标签 + 披露页 + 就近披露句）是通用模板，**请对照目标市场的现行规则核对**。

### 线索怎么处理
- 线索存 KV 180 天。三种取法：
  - 邮件：设 `LEAD_NOTIFY_EMAIL`，每条线索一封邮件；
  - Webhook：设 `LEADS_WEBHOOK_URL`（Zapier/n8n/CRM 都行），收到 `{type:"lead", lead:{…}}`；
  - 导出：`GET /api/admin/leads?category=freight-forwarder&format=csv`，头部 `Authorization: Bearer <ADMIN_TOKEN>`。
- 删除（用户要求时）：`DELETE /api/admin/leads?email=…` 或 `?id=…`。
- 表单上的同意文字写的是"可能分享给匹配的服务商"。**只把线索转给你真正有合作的服务商，并且在隐私政策里按类别列出**；不要卖给不在名单里的第三方。
- 线索质量比数量重要：先手动转 5–10 条给你认识的服务商，听他们的反馈再扩大。

## 9. 第三方数据：收费/高流量前必须读的条款

| 数据 | 用在哪 | 风险 |
|---|---|---|
| 汇率（open.er-api.com 为首选，Frankfurter、jsDelivr currency-api 为后备） | 汇率工具、`/api/v1/rates` | 开放接口通常要求署名、限制频率，**转售/收费 API 是否允许需读条款**。API 响应里已带 `source` 和 `attribution` 字段。可用 `FX_SOURCES` 变量调整来源顺序，或换成有付费授权的数据源 |
| OpenStreetMap Nominatim | 邮编工具（Zippopotam 未覆盖的国家） | 官方使用政策限制频率和批量用途，要求可识别的 UA（Worker 已设）。站点流量大了请换付费地理编码服务或自建 |
| USITC HTS REST | 美国关税、HS 查询、`/api/v1/tariff/us`、政策提醒 cron | 官方公共接口，仍请确认使用条款和频率；Worker 对结果做了 6 小时边缘缓存 |
| Zippopotam.us | 邮编 | 免费服务，请确认商用条款 |
| Paddle.js CDN | 结账 | 官方脚本 |

所有第三方请求都经 `/api/p/…` 同源代理（只允许白名单路径），好处是集中缓存和更换来源。

## 10. 上线检查清单

- [ ] 占位符全部填好，`npm run build:prod` 通过（无警告）
- [ ] `config/site.config.json` 的价格 = Paddle 价格
- [ ] Paddle 沙盒完整流程通过（第 4 节清单）→ 再切生产
- [ ] `/api/health` 全部 configured
- [ ] 登录邮件能到收件箱（不进垃圾箱）
- [ ] Search Console / Bing 提交 sitemap
- [ ] 隐私政策里的数据接收方与实际一致（Cloudflare、Paddle、邮件服务商、你的统计方式）
- [ ] 如果接了联盟/线索转发：披露页、隐私政策里列出服务商类别
- [ ] 法律文本经你或律师确认
- [ ] 读完第 9 节的数据条款，决定是否继续开放 `/api/v1/rates`

## 11. 已知限制

- 浏览器端的 Pro 限制可被绕过（见第 4 节"需要你决定的一件事"）。
- 回访率按浏览器计算，是下限。
- KV 计数器是最终一致的，配额和限流是"近似"，极端并发下可能略微超额。
- 会话令牌是无状态的（30 天），"退出登录"只清除本机令牌；要强制全部会话失效需更换 `SESSION_SECRET`（会让所有人重新登录）。
- cron 每天最多检查 `CRON_MAX_CODES`（默认 40）个关注税号，超出的按"最久未检查"轮换；订阅者很多时需升级套餐并调大该值。
- 只有 Chrome 插件 + 网站两个入口；没有做 Firefox/Edge 商店版本。
