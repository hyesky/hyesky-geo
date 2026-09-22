"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Radar,
  ScrollText,
  MessageSquare,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
};

const NAV_GROUPS: { id: string; label: string | null; items: NavItem[] }[] = [
  {
    id: "default",
    label: null,
    items: [{ href: "/dashboard", label: "仪表盘", icon: LayoutDashboard }],
  },
  {
    id: "audit",
    label: "扫描",
    items: [
      { href: "/scans", label: "扫描任务", icon: ListTodo },
      { href: "/results", label: "扫描结果", icon: ScrollText },
    ],
  },
  {
    id: "settings",
    label: "设置",
    items: [
      { href: "/brands", label: "品牌", icon: Tags },
      { href: "/prompts", label: "探针", icon: MessageSquare },
      { href: "/byok", label: "API 密钥", icon: KeyRound, hint: "BYOK" },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  className,
}: {
  item: NavItem;
  pathname: string;
  className?: string;
}) {
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 [&_svg]:transition-transform [&_svg]:duration-200",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent hover:text-foreground hover:[&_svg]:scale-110",
        className,
      )}
    >
      <item.icon className="h-4 w-4" />
      <span className="flex min-w-0 items-baseline gap-1.5">
        {item.label}
        {item.hint ? (
          <span className="text-[10px] font-normal text-muted-foreground/60">{item.hint}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 sonar-grid opacity-40" />
      <div className="relative mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background/90 px-4 py-6 backdrop-blur md:flex">
          <Link href="/" className="mb-8 flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground">
              <Radar className="h-4 w-4" />
            </span>
            <span className="font-sans text-xl font-semibold tracking-tight">Hyesky GEO</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                {group.label ? (
                  <p className="px-3 pb-0.5 text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/50">
                    {group.label}
                  </p>
                ) : null}
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <p className="px-3 pb-0.5 text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/50">
                账户
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:translate-x-0.5 hover:bg-accent hover:text-foreground hover:[&_svg]:scale-110 [&_svg]:transition-transform [&_svg]:duration-200"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </nav>
          <div className="mt-auto space-y-3 px-1">
            <ThemeToggle className="w-full justify-center" />
            <p className="px-2 text-[11px] text-muted-foreground">
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
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href="/" className="font-sans text-lg font-semibold tracking-tight">
                Hyesky GEO
              </Link>
              <ThemeToggle />
            </div>
            <nav className="flex items-start gap-6 overflow-x-auto px-4 pb-3">
              {NAV_GROUPS.map((group) => (
                <div key={group.id} className="flex flex-col gap-1">
                  {group.label ? (
                    <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/50">
                      {group.label}
                    </p>
                  ) : (
                    <span className="h-3" />
                  )}
                  <div className="flex gap-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        className="px-2 py-1.5"
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/50">
                  账户
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground hover:[&_svg]:scale-110 [&_svg]:transition-transform [&_svg]:duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </nav>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
          <p className="px-4 pb-4 text-[11px] text-muted-foreground md:hidden">
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
        </div>
      </div>
    </div>
  );
}
