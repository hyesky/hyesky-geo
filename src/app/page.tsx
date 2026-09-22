import Link from "next/link";
import { BookOpen, Github, KeyRound, Radar, Rows3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ProviderLogo } from "@/components/providers/provider-logo";
import { Button } from "@/components/ui/button";
import { HeroCopy } from "@/components/landing/hero-copy";
import { HeroMonitor } from "@/components/landing/hero-monitor";
import { ENGINE_META, PROVIDER_IDS } from "@/lib/types";

const DOCS_URL = "https://github.com/hyesky/hyesky-geo";
const GITHUB_URL = "https://github.com/hyesky/hyesky-geo";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 sonar-grid" />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground">
            <Radar className="h-4 w-4" />
          </span>
          <span className="font-sans text-2xl font-semibold tracking-tight">Hyesky GEO</span>
        </Link>
        <div className="flex items-center gap-3">
          <nav className="mr-1 hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                <BookOpen />
                文档
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github />
                GitHub
              </a>
            </Button>
          </nav>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
            aria-label="文档"
          >
            <BookOpen className="h-4 w-4" />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-8 md:pt-10">
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <HeroCopy />
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              {PROVIDER_IDS.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
                    <ProviderLogo id={id} className="h-4 w-4" />
                  </span>
                  {ENGINE_META[id].label}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github />
                  访问 GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                  <BookOpen />
                  阅读文档
                </a>
              </Button>
            </div>
          </div>
          <HeroMonitor />
        </section>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: KeyRound,
              title: "自带密钥，静态加密",
              body: "OpenAI、DeepSeek、Qwen、智谱 GLM、Kimi、豆包、腾讯混元的密钥都以 AES-256-GCM 加密存储在 Postgres 中。浏览器永远不会回读；/api/run 仅在单次请求内解密。",
            },
            {
              icon: Rows3,
              title: "顺序任务队列",
              body: "客户端任务队列逐个引擎调用 /api/run 并带退避重试，限流不会毁掉你的第一次扫描。",
            },
            {
              icon: Radar,
              title: "未点名式评分",
              body: "提及率与引用率只统计未点名你品牌的探针，重复提问不会虚增可见性。",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-4 font-sans text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative mx-auto max-w-6xl px-6 pb-10">
        <p className="text-[11px] text-muted-foreground">
          开源项目{" "}
          <a
            href="https://github.com/hyesky/hyesky-geo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Hyesky
          </a>
        </p>
      </footer>
    </div>
  );
}
