import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetrics } from "@/lib/metrics";
import { cn, formatPercent } from "@/lib/utils";
import { Hash, Quote, Radar, Swords } from "lucide-react";
import { PrintText } from "@/components/ui/print-text";

const VALUE = "font-mono text-3xl tabular-nums tracking-tight";

function RateBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-teal-600/80 transition-all dark:bg-teal-400/70"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

export function MetricsCards({
  metrics,
  loading,
}: {
  metrics: DashboardMetrics | null;
  loading: boolean;
}) {
  const hasProbes = Boolean(metrics && metrics.unpromptedRuns > 0);
  const hasMarket = Boolean(metrics && metrics.marketRuns > 0);
  const visibilityLow = hasProbes && metrics!.visibilityScore < 0.8;
  const rankWarn = hasProbes && (metrics!.averageRank == null || metrics!.averageRank > 3);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            AI 可见性
            <InfoTip label="关于 AI 可见性">
              最近一批「未点名」回答中提到你品牌的占比。未点名指探针文字不含你的名字。
              提及采用名称与别名匹配；若配置了分析模型，还能识别改写表述。点名品牌的探针不参与统计。
            </InfoTip>
          </CardTitle>
          <Radar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div
              className={cn(
                VALUE,
                hasProbes ? "text-sky-800 dark:text-sky-300" : "text-muted-foreground",
              )}
            >
              <PrintText
                key={String(metrics?.visibilityScore)}
                text={hasProbes ? formatPercent(metrics!.visibilityScore) : "—"}
                speed={22}
              />
            </div>
          )}
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {hasProbes
              ? `${metrics!.mentionedCount}/${metrics!.unpromptedRuns} 次未点名提及`
              : "已排除点名品牌的探针。"}
          </p>
          {visibilityLow ? (
            <p className="mt-1 text-xs text-sky-800/80 dark:text-sky-300/80">
              低于 80% — 品类类回答经常跳过你。
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            引用率
            <InfoTip label="关于引用率">
              同一批「未点名」回答中、以 URL 形式引用你官方域名的占比。仅提到品牌名而没有可点击的
              官方链接不计入。取每个探针与引擎的最新结果。
            </InfoTip>
          </CardTitle>
          <Quote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div
              className={cn(
                VALUE,
                hasProbes ? "text-teal-800 dark:text-teal-300" : "text-muted-foreground",
              )}
            >
              <PrintText
                key={String(metrics?.citationRate)}
                text={hasProbes ? formatPercent(metrics!.citationRate) : "—"}
                speed={22}
              />
            </div>
          )}
          <RateBar value={hasProbes ? metrics!.citationRate : 0} />
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {hasProbes
              ? `${metrics!.citedCount}/${metrics!.unpromptedRuns} 个回答引用了你的域名`
              : "本次扫描没有未点名探针。"}
          </p>
          {hasProbes && metrics!.mentionedCount > metrics!.citedCount ? (
            <p className="mt-1 text-xs text-teal-800/80 dark:text-teal-300/80">
              提到但未提供可点击的官方链接。
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            拦截率
            <InfoTip label="关于拦截率">
              不点名你品牌的品类/场景探针中，你未被提及但列出的竞品被提及的占比。
              品牌和竞品探针不参与统计。数字下方显示最常见的拦截竞品。
            </InfoTip>
          </CardTitle>
          <Swords className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div
              className={cn(
                VALUE,
                hasMarket ? "text-rose-800 dark:text-rose-300" : "text-muted-foreground",
              )}
            >
              <PrintText
                key={String(metrics?.interceptionRate)}
                text={hasMarket ? formatPercent(metrics!.interceptionRate) : "—"}
                speed={22}
              />
            </div>
          )}
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {hasMarket
              ? `${metrics!.interceptCount}/${metrics!.marketRuns} 个品类/场景回答提到竞品而非你`
              : "需要品类或场景探针。"}
          </p>
          {metrics?.topInterceptor ? (
            <p className="mt-1 text-xs text-rose-800/80 dark:text-rose-300/80">
              最常被 {metrics.topInterceptor} 拦截。
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            平均引用排名
            <InfoTip label="关于平均引用排名">
              在被引用的「未点名」回答中，你官方域名在引用来源中的平均位置。#1 表示第一个列出的来源，
              并非 AI 生成的排名。显示「无排名」表示还没有官方域名引用。
            </InfoTip>
          </CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div
              className={cn(
                VALUE,
                hasProbes && metrics!.averageRank != null
                  ? "text-indigo-800 dark:text-indigo-300"
                  : "text-muted-foreground",
              )}
            >
              <PrintText
                key={String(metrics?.averageRank)}
                text={
                  hasProbes && metrics!.averageRank != null
                    ? `#${metrics!.averageRank.toFixed(1)}`
                    : "无排名"
                }
                speed={22}
              />
            </div>
          )}
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {metrics?.rankedCount
              ? `${metrics.rankedCount} 个被引用来源的平均位置，非 AI 数字榜单`
              : "还没有官方域名引用。"}
          </p>
          {rankWarn ? (
            <p className="mt-1 text-xs text-indigo-800/80 dark:text-indigo-300/80">
              排在前三个被引用来源之外——或未被引用。
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}