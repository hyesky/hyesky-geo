"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Play, Square } from "lucide-react";
import { toast } from "sonner";
import { useScan } from "@/components/scan/context";
import { ScanProgress } from "@/components/scan/scan-progress";
import { ProviderLogo } from "@/components/providers/provider-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobRecord } from "@/lib/jobs";
import { ENGINE_META } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<JobRecord["status"], string> = {
  queued: "排队中",
  running: "运行中",
  completed: "已完成",
  cancelled: "已取消",
  failed: "失败",
};

const STATUS_CLASS: Record<JobRecord["status"], string> = {
  queued: "border-border text-muted-foreground",
  running: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  cancelled: "border-border text-muted-foreground",
  failed: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ScanPage() {
  const scan = useScan();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs");
      const payload = (await response.json()) as { jobs?: JobRecord[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "无法加载扫描记录。");
      setJobs(payload.jobs ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法加载扫描记录。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!scan.running) {
      void load();
      return;
    }
    const timer = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(timer);
  }, [scan.running, load]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">任务</p>
          <h1 className="mt-1 font-sans text-4xl font-semibold tracking-tight">扫描</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            每次顺序运行都会保存为一次扫描。打开结果可查看每个探针 × 供应商的响应。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {scan.running ? (
            <Button variant="outline" onClick={scan.stop}>
              <Square className="h-3.5 w-3.5" />
              停止队列
            </Button>
          ) : (
            <Button onClick={() => scan.openDrawer()}>
              <Play className="h-3.5 w-3.5" />
              开始扫描
            </Button>
          )}
        </div>
      </div>

      {scan.running ? (
        <div className="mb-6">
          <ScanProgress
            completed={scan.completed}
            total={scan.total}
            current={scan.current}
            errors={scan.errors}
            brandName={scan.brandName}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-sans text-2xl font-semibold tracking-tight">还没有扫描记录</p>
          <p className="mt-2 text-sm text-muted-foreground">
            开始一次顺序扫描来创建第一条记录。
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>开始时间</TableHead>
                <TableHead>品牌</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">结果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const live = (scan.running || scan.starting) && scan.jobId === job.id;
                const completed = live ? scan.completed : job.completed;
                const total = live ? scan.total : job.total;
                const status = live ? "running" : job.status === "running" ? "cancelled" : job.status;
                const statusLabel = live
                  ? "运行中"
                  : job.status === "running"
                    ? "已中断"
                    : STATUS_LABEL[job.status];
                return (
                  <TableRow key={job.id} className={cn(live && "bg-accent/40")}>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatWhen(job.startedAt ?? job.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{job.brandName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {job.engines.map((engine) => (
                          <span key={engine} className="inline-flex items-center gap-1 text-xs">
                            <ProviderLogo id={engine} className="h-3.5 w-3.5" />
                            {ENGINE_META[engine].label}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {completed}/{total}
                      {job.errors > 0 || (live && scan.errors > 0)
                        ? ` · ${live ? scan.errors : job.errors} 个错误`
                        : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLASS[status]}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/results?scanId=${job.id}`}>查看结果</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
