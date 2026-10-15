# 跨境电商工具箱 · 网站版（Cross-border Trade Toolkit — website）

英文为主、中文为辅的工具站：10 个工具各有独立页面（SEO 落地页 + FAQ + 结构化数据），免费层 + Pro 订阅（Paddle），联盟与线索接入点。工具代码复用 Chrome 插件（`../cbt-toolkit`），插件源码不被修改。

- **上线前必读：`docs/LAUNCH.md`**（里面有"哪些已验证、哪些必须你自己验证"）
- 统计与回访率：`docs/ANALYTICS.md`
- 无运行时依赖：静态站生成器是纯 Node（≥20），Worker 只用 Web 标准 API。

```bash
npm run build        # 生成 dist/
npm run dev          # 本地站 + 真 Worker（内存 KV，第三方数据模拟）  http://localhost:8787
npm test             # 41 项单测（Worker 30 + 静态产物 11）
npm run test:e2e     # 浏览器端到端（需要 Playwright + Chromium）
npm run build:prod   # 严格构建：有占位符/SEO 警告就失败
npm run deploy       # build:prod 后用 wrangler 部署（先看 docs/LAUNCH.md 第 5 节）
```

没有任何收入承诺、没有虚构的合作伙伴或佣金；`config/partners.json` 的伙伴列表是空的。
