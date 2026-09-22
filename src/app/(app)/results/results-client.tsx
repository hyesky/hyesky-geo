"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ResultsTable } from "@/components/dashboard/results-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JobRecord } from "@/lib/jobs";
import type { ResultRow, VisibilityStatus } from "@/lib/metrics";
import { ENGINE_META, PROVIDER_IDS, type EngineId } from "@/lib/types";

type BrandOption = { id: string; name: string };

const STATUS_OPTIONS: { value: "all" | VisibilityStatus; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "cited", label: "被引用" },
  { value: "mentioned", label: "被提及" },
  { value: "prompted", label: "被追问，未引用" },
  { value: "hidden", label: "不可见" },
];

export function ResultsClient() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [brandId, setBrandId] = useState("all");
  const [engine, setEngine] = useState<"all" | EngineId>("all");
  const [status, setStatus] = useState<"all" | VisibilityStatus>("all");
  const [scanId, setScanId] = useState("all");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setScanId(searchParams.get("scanId") ?? searchParams.get("jobId") ?? "all");
  }, [searchParams]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/brands").then(async (response) => {
        const payload = (await response.json()) as { brands?: BrandOption[] };
        setBrands(payload.brands ?? []);
      }),
      fetch("/api/jobs").then(async (response) => {
        const payload = (await response.json()) as { jobs?: JobRecord[] };
        setJobs(payload.jobs ?? []);
      }),
    ]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (brandId !== "all") params.set("brandId", brandId);
      if (engine !== "all") params.set("engine", engine);
      if (status !== "all") params.set("status", status);
      if (scanId !== "all") params.set("jobId", scanId);
      const response = await fetch(`/api/logs?${params.toString()}`);
      const payload = (await response.json()) as { rows?: ResultRow[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "无法加载结果。");
      setRows(payload.rows ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法加载结果。");
    } finally {
      setLoading(false);
    }
  }, [brandId, engine, status, scanId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">任务</p>
        <h1 className="mt-1 font-sans text-4xl font-semibold tracking-tight">结果</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          每次引擎响应都会被保留。可按品牌、供应商、状态或扫描筛选。
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={brandId} onValueChange={setBrandId}>
          <SelectTrigger>
            <SelectValue placeholder="品牌" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部品牌</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={engine} onValueChange={(value) => setEngine(value as "all" | EngineId)}>
          <SelectTrigger>
            <SelectValue placeholder="供应商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部供应商</SelectItem>
            {PROVIDER_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {ENGINE_META[id].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as "all" | VisibilityStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scanId} onValueChange={setScanId}>
          <SelectTrigger>
            <SelectValue placeholder="扫描" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部扫描</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.brandName} · {new Date(job.createdAt).toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResultsTable
        rows={rows}
        loading={loading}
        runningKey={null}
        showBrand
        showTime
        pageSize={20}
        emptyTitle="还没有结果"
        emptyHint="运行一次扫描来捕获引擎响应。筛选条件适用于已保存的结果。"
      />
    </>
  );
}
