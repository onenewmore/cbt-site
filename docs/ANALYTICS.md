# 统计与回访率：事件表、指标定义、SQL

目标：看**自然流量**和**回访率**，不用 Cookie、不存 IP、不存 User-Agent。

## 1. 怎么采集

| 层 | 做什么 |
|---|---|
| 浏览器 `assets/js/track.js` | 每个页面发 `pageview`；每次"访问"（距上次操作超过 30 分钟算新访问）发一次 `new_visitor` 或 `return_visit`。回访判断只用 localStorage 里的 3 个数字（`cbt_first`、`cbt_last`、`cbt_visits`），上报的只是**区间**（见下表），没有任何用户标识。 |
| Worker `POST /api/e` | 校验事件名白名单 → 丢弃爬虫（UA 含 bot/crawl/headless 等）→ 写入 Cloudflare Workers Analytics Engine。国家来自边缘网络（只存国家代码）。 |
| 可选 Plausible | `site.config.json` 的 `analytics.plausibleDomain` 填了才加载；与自有统计互不依赖。 |

## 2. 数据点布局（Analytics Engine 数据集 `cbt_events`）

`index1` = 事件名；`double1` = 1。

| 列 | 内容 |
|---|---|
| blob1 | 事件名 |
| blob2 | 语言 `en` / `zh` |
| blob3 | 页面路径（访问类事件里就是**落地页**） |
| blob4 | 页面类型 `tool` `article` `hub` `pricing` `quote` … |
| blob5 | 国家代码 |
| blob6 | 来源类别：`organic`（搜索引擎）`social` `other` `direct` `internal`（站内跳转） |
| blob7 | 来源域名（仅 pageview / new_visitor / return_visit） |
| blob8 | 工具 id |
| blob9 | 类别（报价类别 / 线索类别） |
| blob10 | `src`（从哪个工具页进入的） |
| blob11 | 合作伙伴 id |
| blob12 | 累计访问次数区间：`2` `3` `4` `5+`（仅 return_visit） |
| blob13 | 距首次访问：`0` `1` `2-6` `7-29` `30+` 天（仅 return_visit） |
| blob14 | 距上次访问：同上（仅 return_visit） |
| blob15 | 套餐 / Pro 标记（`monthly` `annual` `pro1` `pro0`） |
| blob16 | where / what / reason / tab（付费墙原因、CTA 位置等） |
| blob17 | `mobile` / `desktop` |

事件清单：`pageview` `new_visitor` `return_visit` `tool_use` `copy_result` `pro_cta` `checkout_open` `checkout_complete` `checkout_closed` `checkout_return` `limit_hit` `export_click` `bulk_run` `bulk_tab` `lead_form_start` `lead_submit` `affiliate_click` `quote_cta` `signin_ok` `login_request` `apikey_rotate` `extension_click` `lang_switch`；服务端另写 `lead_server`（线索入库）和 `affiliate_redirect`（`/go/` 跳转，广告拦截拦不住，**以它为准**）。

## 3. 指标定义（先建基线，再谈目标）

| 指标 | 定义 |
|---|---|
| 访问数（visits） | `new_visitor` + `return_visit` 的数量 |
| **自然流量** | 访问数中 `blob6 = 'organic'` |
| 自然流量落地页 | 同上按 `blob3` 分组 |
| **回访率（按访问）** | `return_visit` ÷ 访问数 |
| 7 天内回访 | `return_visit` 且 `blob13 IN ('1','2-6')`（首次访问后 7 天内再来） |
| 老用户深度 | `return_visit` 按 `blob12` 分布 |
| 工具使用率 | `tool_use` ÷ 访问数（按工具） |
| 付费转化漏斗 | `limit_hit` → `pro_cta` → `checkout_open` → `checkout_complete` |
| 线索转化 | `lead_submit` ÷ `lead_form_start`；按 `blob9`（类别）和 `blob10`（来源工具）拆 |
| 联盟点击 | `affiliate_redirect`（服务端）按 `blob11` |

注意：
- 回访按"浏览器"算，不是按"人"算。换设备、清缓存、隐私模式都会被当成新访客，所以**回访率是下限**。
- Analytics Engine 会对数据采样，所以 SQL 里一律用 `SUM(_sample_interval)`，不要用 `COUNT(*)`。
- Analytics Engine 的数据保留期有限（官方文档为准，我记得约 3 个月），**每月把汇总结果导出存档**。
- `internal` 来源不算外部来源；看来源构成时请排除它。

## 4. SQL 示例

在 Cloudflare 里查询：`POST https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql`，请求体就是 SQL，Token 需要 Account Analytics: Read 权限。下面的函数写法请对照当前官方 SQL 参考核对一次（我没有联网核对过）。

```sql
-- 1. 近 30 天每天的访问数，按来源类别
SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day,
       blob6 AS source,
       SUM(_sample_interval) AS visits
FROM cbt_events
WHERE blob1 IN ('new_visitor', 'return_visit')
  AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY day, source
ORDER BY day, source;

-- 2. 每周回访率
SELECT toStartOfInterval(timestamp, INTERVAL '7' DAY) AS week,
       SUM(IF(blob1 = 'return_visit', _sample_interval, 0)) AS return_visits,
       SUM(_sample_interval) AS visits,
       SUM(IF(blob1 = 'return_visit', _sample_interval, 0)) / SUM(_sample_interval) AS return_rate
FROM cbt_events
WHERE blob1 IN ('new_visitor', 'return_visit')
  AND timestamp > NOW() - INTERVAL '90' DAY
GROUP BY week
ORDER BY week;

-- 3. 自然流量最多的落地页（近 28 天）
SELECT blob3 AS landing_page, SUM(_sample_interval) AS organic_visits
FROM cbt_events
WHERE blob1 IN ('new_visitor', 'return_visit') AND blob6 = 'organic'
  AND timestamp > NOW() - INTERVAL '28' DAY
GROUP BY landing_page
ORDER BY organic_visits DESC
LIMIT 30;

-- 4. 回访间隔分布
SELECT blob13 AS since_first, SUM(_sample_interval) AS visits
FROM cbt_events
WHERE blob1 = 'return_visit' AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY since_first
ORDER BY visits DESC;

-- 5. 哪个工具带来回访（回访时的落地页）
SELECT blob3 AS landing_page, SUM(_sample_interval) AS return_visits
FROM cbt_events
WHERE blob1 = 'return_visit' AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY landing_page
ORDER BY return_visits DESC
LIMIT 20;

-- 6. 付费墙原因 → Pro 点击（看该把哪项功能放进订阅）
SELECT blob1 AS event, blob16 AS reason, SUM(_sample_interval) AS n
FROM cbt_events
WHERE blob1 IN ('limit_hit', 'pro_cta', 'checkout_open', 'checkout_complete')
  AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY event, reason
ORDER BY n DESC;

-- 7. 线索：按类别和来源工具
SELECT blob9 AS category, blob10 AS source_tool, SUM(_sample_interval) AS leads
FROM cbt_events
WHERE blob1 = 'lead_server' AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY category, source_tool
ORDER BY leads DESC;

-- 8. 联盟点击（服务端跳转为准）
SELECT blob11 AS partner, blob10 AS source_tool, SUM(_sample_interval) AS clicks
FROM cbt_events
WHERE blob1 = 'affiliate_redirect' AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY partner, source_tool
ORDER BY clicks DESC;

-- 9. 中英文流量和国家
SELECT blob2 AS lang, blob5 AS country, SUM(_sample_interval) AS visits
FROM cbt_events
WHERE blob1 IN ('new_visitor', 'return_visit') AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY lang, country
ORDER BY visits DESC
LIMIT 40;
```

## 5. 每周看什么（建议）

1. 自然流量访问数的周趋势，以及 Search Console 里的展示/点击/平均排名（Search Console 才是搜索表现的权威来源，本站统计只能看到"已经点进来的人"）。
2. 回访率和"7 天内回访"占比：只和自己上周比。
3. 付费墙原因 → `pro_cta` 的转化：哪个限制最让人想付费。
4. 线索数和各类别的 `lead_form_start → lead_submit` 转化。
5. 每月：导出所有汇总结果存档（保留期有限）。

## 6. 隐私边界（已和隐私政策对齐）

- 不存 IP、不存 UA 字符串、不设 Cookie、没有跨站标识。
- 存的只有：页面、语言、设备类型（mobile/desktop）、国家代码、来源域名、访问次数区间。
- 限流计数器会短时间使用 IP（分钟到小时），线索会存 IP 的加盐哈希——隐私政策里已写明。
- 如果你改了采集内容，先改 `content/ui.mjs` 里的隐私政策，再上线。
