# Hyesky GEO

> Open-source **GEO** (Generative Engine Optimization) radar — see if AI search engines mention and cite your brand.
> 开源 **GEO**（生成式引擎优化）雷达 —— 监控 AI 搜索引擎是否提及并引用你的品牌。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hyesky/hyesky-geo)

**Hyesky GEO** is a privacy-first, BYOK monitor for OpenAI, DeepSeek, Qwen, Zhipu GLM, Kimi (Moonshot), Doubao (Volcano Ark), and Tencent Hunyuan. It scores whether those engines mention your brand, cite your domain, or hand the answer to a competitor.

**Hyesky GEO** 是一款隐私优先、自带密钥的监控工具，支持 OpenAI、DeepSeek、Qwen（通义千问）、智谱 GLM、Kimi（月之暗面）、豆包（火山方舟）和腾讯混元。它统计这些引擎是否提及你的品牌、是否引用你的域名，或是否把答案推给了竞品。

Self-hosted. Your keys. One admin password. No SaaS markup.
自托管。你的密钥。一个管理员密码。无 SaaS 加成。

**Documentation:** [docs/](docs/README.md) — install, deploy, scoring, and FAQ.
**文档：** [docs/](docs/README.md) —— 安装、部署、评分规则与常见问题。

<p align="center">
  <img src="docs/images/dashboard.png" alt="Hyesky GEO visibility dashboard" />
</p>

## Features 特性

- **BYOK** — provider keys are encrypted with AES-256-GCM in Postgres and never sent back to the browser
  **自带密钥** — 各厂商密钥以 AES-256-GCM 加密存储于 Postgres，永不回传浏览器
- **Optional analysis model** — pick one saved provider to catch brand mentions that string matching misses; citations stay URL-based
  **可选分析模型** — 可选一个已保存的厂商做智能判定，弥补字符串匹配的漏判；引用仍基于 URL
- **Multi-engine scans** — OpenAI `gpt-4o` + web search, DeepSeek `deepseek-chat`, Qwen `qwen-plus`, Zhipu `glm-4-flash`, Kimi `moonshot-v1-8k`, Doubao `doubao-seed`, Hunyuan `hunyuan-turbo-latest`
  **多引擎扫描** — 9 家国内外引擎，其中 6 家为国内大模型厂商
- **Visibility scoring** — unprompted mention rate, citation rate, category/scenario interception rate, and average citation rank
  **可见性评分** — 未点名提及率、引用率、品类/场景拦截率与平均引用排名
- **Prompt matrix** — each brand stores name, domain, aliases, competitors, category, and language; saving expands Brand / Category / Competitor / Scenario probes
  **探针矩阵** — 每个品牌保存名称、域名、别名、竞品、品类与语言；保存后自动展开 品牌 / 品类 / 竞品 / 场景 四维探针
- **Queue-friendly** — client-side sequential jobs with backoff, so a first scan does not burn rate limits or serverless timeouts
  **队列友好** — 客户端顺序任务队列带退避重试，首次扫描不会打爆限流或超时
- **Deploy your way** — Vercel + Supabase, or Postgres in Docker and the app on Node
  **随意部署** — 可选 Vercel + Supabase，或 Docker 内 Postgres + Node 运行应用

## Quick start (local) 本地快速开始

```bash
git clone https://github.com/hyesky/hyesky-geo.git
cd hyesky-geo
cp .env.example .env
```

Create a 32-byte secret and put it in `.env`:
生成 32 字节密钥并写入 `.env`：

```bash
openssl rand -hex 32
```

```env
DATABASE_URL="postgresql://opencitex:***@localhost:5432/opencitex?schema=public"
ENCRYPTION_KEY="<paste the hex here>"
```

`docker compose` starts **Postgres only**. Then run the app with Node:
`docker compose` 只启动 **Postgres**，然后用 Node 运行应用：

```bash
docker compose up -d
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

`/` is the product landing page. First run: open [http://localhost:3000/setup](http://localhost:3000/setup). After that, sign in at [`/login`](http://localhost:3000/login).

1. **`/setup`** — admin password + recovery code (shown once)｜设置管理员密码 + 恢复码（仅显示一次）
2. **`/byok`** — paste provider API keys (shared across brands)｜填入各厂商 API 密钥（全品牌共享）
3. **`/brands`** — add brands; saving generates the 4-dimension probe set｜添加品牌，保存后自动生成四维探针
4. **`/dashboard`** — pick a brand and run a sequential scan｜选择品牌并运行顺序扫描

The seed workspace includes a Hyesky example brand. Change it under Brands.
种子工作区包含一个 Hyesky 示例品牌，可在「品牌」页修改。

## Environment 环境变量

| Variable 变量 | Required 必填 | Purpose 用途 |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string / Postgres 连接串 |
| `ENCRYPTION_KEY` | Yes | 64-char hex. Encrypts BYOK keys and signs the session cookie / 64 位十六进制，加密密钥并签名会话 Cookie |
| `AUTH_SECRET` | No | Session HMAC secret. Defaults to `ENCRYPTION_KEY` / 会话 HMAC 密钥，默认取 `ENCRYPTION_KEY` |
| `DIRECT_URL` | No | Direct Postgres URI for migrations on Supabase / Supabase 迁移用直连 URI |
| `NEXT_PUBLIC_APP_URL` | No | Public origin for canonical URLs / 站点公开地址 |

Rotating `ENCRYPTION_KEY` makes previously stored API keys unreadable. Paste them again after a rotation.
轮换 `ENCRYPTION_KEY` 会让已存的密钥无法解密，轮换后需在设置页重新填写。

## How a scan works 扫描原理

1. The dashboard queues `prompt × engine` jobs in the browser 仪表盘在浏览器中按「探针 × 引擎」排队
2. Each job `POST`s `/api/run` with **no keys in the body** 每次任务请求体不含密钥
3. The server decrypts workspace keys for that request, calls the engine, stores the answer and citation URLs 服务端只为该请求解密密钥、调用引擎并存储回答与引用 URL
4. Mentions are scored with whole-word matching against the brand name, domain, and aliases; citation is true only when a cited host matches the target domain 提及按品牌名/域名/别名的整词匹配判定；引用仅当引用来源域名匹配目标域名时成立
5. Dashboard rates only count **unprompted** probes (the prompt does not name the brand) 仪表盘比率只统计未点名的探针

The landing-page monitor card is **demo data**, not a live scan.
落地页监控卡片为演示数据，并非真实扫描。

## Contact 联系

Issues: [github.com/hyesky/hyesky-geo/issues](https://github.com/hyesky/hyesky-geo/issues)

## License 许可

[MIT](LICENSE)
