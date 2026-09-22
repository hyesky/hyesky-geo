"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVE_BRAND_KEY, PROBE_LANGUAGES, probeLanguage, probeLanguageLabel } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PromptCategory } from "@prisma/client";

type Probe = {
  id: string;
  text: string;
  category: PromptCategory;
};

type Brand = {
  id: string;
  name: string;
  targetDomain: string;
  aliases: string[];
  competitors: string[];
  industryCategory: string | null;
  description: string | null;
  language: string;
  prompts?: Probe[];
  _count?: { prompts: number };
};

type BrandForm = {
  name: string;
  targetDomain: string;
  aliases: string;
  competitors: string;
  industryCategory: string;
  description: string;
  language: string;
};

const EMPTY_FORM: BrandForm = {
  name: "",
  targetDomain: "",
  aliases: "",
  competitors: "",
  industryCategory: "",
  description: "",
  language: "en",
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromBrand(brand: Brand): BrandForm {
  return {
    name: brand.name,
    targetDomain: brand.targetDomain,
    aliases: brand.aliases.join(", "),
    competitors: brand.competitors.join(", "),
    industryCategory: brand.industryCategory ?? "",
    description: brand.description ?? "",
    language: probeLanguage(brand.language),
  };
}

function writeActiveBrandId(id: string) {
  window.localStorage.setItem(ACTIVE_BRAND_KEY, id);
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const response = await fetch("/api/brands");
      const payload = (await response.json()) as { brands?: Brand[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "无法加载品牌。");
      setBrands(payload.brands ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法加载品牌。");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditingId(brand.id);
    setForm(formFromBrand(brand));
    setDialogOpen(true);
  }

  async function persist() {
    setSaving(true);
    try {
      const body = {
        name: form.name,
        targetDomain: form.targetDomain,
        aliases: splitList(form.aliases),
        competitors: splitList(form.competitors),
        industryCategory: form.industryCategory,
        description: form.description,
        language: form.language,
      };
      const response = await fetch(editingId ? `/api/brands/${editingId}` : "/api/brands", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        brand?: Brand;
        error?: string;
      };
      if (!response.ok || !payload.brand) throw new Error(payload.error || "无法保存品牌。");
      writeActiveBrandId(payload.brand.id);
      toast.success(editingId ? "品牌已更新。" : "品牌已创建。");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function removeBrand(id: string) {
    if (!window.confirm("确定要删除该品牌及其扫描结果吗？")) return;
    try {
      const response = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "删除失败。");
      }
      toast.success("品牌已删除。");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败。");
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">工作区</p>
          <h1 className="mt-1 font-sans text-4xl font-semibold tracking-tight">品牌</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            每个品牌都有自己独立的域名、别名、竞品和探针。创建品牌会生成一组初始探针，之后可以自行编辑。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          添加品牌
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑品牌" : "添加品牌"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "更新品牌详情。探针保持原样，除非你在「探针」中编辑它们。"
                : "保存时会根据这些字段生成品牌、品类、竞品和场景探针。之后可以编辑。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <section className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                基本信息
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">品牌名称</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Hyesky"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">官方网站</Label>
                  <Input
                    id="domain"
                    value={form.targetDomain}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, targetDomain: event.target.value }))
                    }
                    className="font-mono"
                    placeholder="hyesky.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="aliases">别名 / 关键词</Label>
                    <InfoTip label="关于别名">
                      品牌在 AI 回答中可能出现的其他名称：昵称、产品名、缩写、曾用名。用逗号分隔。用于提及匹配——请避免 GEO、AI、SEO 这类通用词。
                    </InfoTip>
                    <span className="text-xs font-normal text-muted-foreground">可选</span>
                  </div>
                  <Input
                    id="aliases"
                    value={form.aliases}
                    onChange={(event) => setForm((current) => ({ ...current, aliases: event.target.value }))}
                    placeholder="Hyesky, hyesky-geo"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="competitors">竞品</Label>
                    <InfoTip label="关于竞品">
                      用逗号分隔的竞品名称。用于识别品类/场景回答中点名了哪家竞品，并生成「竞品」探针。
                    </InfoTip>
                    <span className="text-xs font-normal text-muted-foreground">可选</span>
                  </div>
                  <Input
                    id="competitors"
                    value={form.competitors}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, competitors: event.target.value }))
                    }
                    placeholder="Profound, Goodie AI, Peec AI"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  探针配置
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {editingId
                    ? "品牌创建时使用。已存在的探针不会被覆盖。"
                    : "这些字段会生成初始的「品牌 / 品类 / 竞品 / 场景」四类探针。"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>探针语言</Label>
                <div className="flex w-full rounded-md border border-input p-0.5">
                  {PROBE_LANGUAGES.map((language) => (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, language: language.id }))}
                      className={cn(
                        "h-8 flex-1 rounded-md text-sm font-medium transition-colors",
                        probeLanguage(form.language) === language.id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="industry">行业分类</Label>
                  <InfoTip label="关于行业分类">
                    你的品牌所处的市场或品类，用于生成品类探针，例如“最好的……工具有哪些？”。示例：AI 搜索可见性追踪。
                  </InfoTip>
                  <span className="text-xs font-normal text-muted-foreground">可选</span>
                </div>
                <Input
                  id="industry"
                  value={form.industryCategory}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, industryCategory: event.target.value }))
                  }
                  placeholder="AI 搜索可见性追踪"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="description">定位 / 要完成的任务</Label>
                  <InfoTip label="关于定位">
                    你解决的客户任务或问题，用于生成场景探针，例如“如何……？”。示例：监控 ChatGPT 是否引用我的域名。
                  </InfoTip>
                  <span className="text-xs font-normal text-muted-foreground">可选</span>
                </div>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="监控 ChatGPT 是否引用我的域名"
                />
              </div>
            </section>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                取消
              </Button>
              <Button
                onClick={() => void persist()}
                disabled={saving || form.name.trim().length < 1 || form.targetDomain.trim().length < 3}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {editingId ? "保存中…" : "创建中…"}
                  </>
                ) : editingId ? (
                  "保存品牌"
                ) : (
                  "创建品牌"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-2 rounded-xl border border-border p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          还没有品牌。添加一个品牌即可生成探针并运行扫描。
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>品牌</TableHead>
                <TableHead>域名</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>语言</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <p className="font-medium">{brand.name}</p>
                    {brand.aliases.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">{brand.aliases.join(", ")}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{brand.targetDomain}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {brand.industryCategory || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{probeLanguageLabel(brand.language)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/prompts?brandId=${brand.id}`}>
                          <MessageSquare className="h-3.5 w-3.5" />
                          探针 ({brand._count?.prompts ?? brand.prompts?.length ?? 0})
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-rose-500/10 hover:text-rose-400"
                        onClick={() => void removeBrand(brand.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
