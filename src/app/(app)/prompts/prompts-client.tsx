"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ACTIVE_BRAND_KEY, ACTIVE_PROJECT_KEY, CATEGORY_META } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PromptCategory } from "@prisma/client";

type BrandOption = { id: string; name: string };

type PromptRow = {
  id: string;
  text: string;
  category: PromptCategory;
  brandId: string;
  brand: { id: string; name: string };
};

const CATEGORIES = Object.keys(CATEGORY_META) as PromptCategory[];

function readActiveBrandId() {
  return window.localStorage.getItem(ACTIVE_BRAND_KEY) ?? window.localStorage.getItem(ACTIVE_PROJECT_KEY);
}

function writeActiveBrandId(id: string) {
  window.localStorage.setItem(ACTIVE_BRAND_KEY, id);
}

function CategoryToggle({
  value,
  onChange,
}: {
  value: PromptCategory;
  onChange: (value: PromptCategory) => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg border border-border bg-card p-0.5"
      role="group"
      aria-label="探针类型"
    >
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={cn(
            "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all duration-200",
            value === category
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          aria-pressed={value === category}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", CATEGORY_META[category].dotClass)} />
          {CATEGORY_META[category].label}
        </button>
      ))}
    </div>
  );
}

export function PromptsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBrandId = searchParams.get("brandId");
  const urlBrandIdRef = useRef(urlBrandId);
  urlBrandIdRef.current = urlBrandId;

  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandId, setBrandId] = useState("");
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PromptRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PromptRow | null>(null);
  const [draftCategory, setDraftCategory] = useState<PromptCategory>("category");
  const [draftText, setDraftText] = useState("");

  const load = useCallback(async (preferredId?: string) => {
    setLoading(true);
    try {
      const brandsRes = await fetch("/api/brands");
      const brandsPayload = (await brandsRes.json()) as { brands?: BrandOption[]; error?: string };
      if (!brandsRes.ok) throw new Error(brandsPayload.error || "加载品牌失败。");
      const list = (brandsPayload.brands ?? []).map((item) => ({ id: item.id, name: item.name }));
      setBrands(list);

      const requested = preferredId ?? urlBrandIdRef.current ?? readActiveBrandId();
      const selected = list.find((item) => item.id === requested) ?? list[0] ?? null;
      if (!selected) {
        setBrandId("");
        setPrompts([]);
        return;
      }

      setBrandId(selected.id);
      writeActiveBrandId(selected.id);
      if (urlBrandIdRef.current !== selected.id) {
        router.replace(`/prompts?brandId=${selected.id}`);
      }

      const promptsRes = await fetch(`/api/prompts?brandId=${selected.id}`);
      const promptsPayload = (await promptsRes.json()) as { prompts?: PromptRow[]; error?: string };
      if (!promptsRes.ok) throw new Error(promptsPayload.error || "加载探针失败。");
      setPrompts(promptsPayload.prompts ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载探针失败。");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!urlBrandId || !brandId || urlBrandId === brandId) return;
    void load(urlBrandId);
  }, [urlBrandId, brandId, load]);

  const selectedBrandName = useMemo(
    () => brands.find((item) => item.id === brandId)?.name,
    [brands, brandId],
  );

  function onBrandChange(id: string) {
    writeActiveBrandId(id);
    router.replace(`/prompts?brandId=${id}`);
    void load(id);
  }

  function openCreate() {
    setDraftCategory("category");
    setDraftText("");
    setCreating(true);
  }

  function openEdit(row: PromptRow) {
    setEditing(row);
    setDraftCategory(row.category);
    setDraftText(row.text);
  }

  async function saveCreate() {
    const text = draftText.trim();
    if (!brandId) {
      toast.error("请先选择品牌。");
      return;
    }
    if (!text) {
      toast.error("探针内容不能为空。");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, text, category: draftCategory }),
      });
      const payload = (await response.json()) as { prompt?: PromptRow; error?: string };
      if (!response.ok || !payload.prompt) throw new Error(payload.error || "无法添加探针。");
      setCreating(false);
      toast.success("探针已添加。");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法添加探针。");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const text = draftText.trim();
    if (!text) {
      toast.error("探针内容不能为空。");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/prompts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category: draftCategory }),
      });
      const payload = (await response.json()) as { prompt?: PromptRow; error?: string };
      if (!response.ok || !payload.prompt) throw new Error(payload.error || "无法保存探针。");
      setPrompts((current) =>
        current.map((item) => (item.id === editing.id ? { ...item, ...payload.prompt! } : item)),
      );
      setEditing(null);
      toast.success("探针已保存。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法保存探针。");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/prompts/${deleting.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "删除失败。");
      }
      setPrompts((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      toast.success("探针已删除。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "无法删除探针。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">工作区</p>
          <h1 className="mt-1 font-sans text-4xl font-semibold tracking-tight">探针</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            扫描时发送给 AI 引擎的探针。可为所选品牌新增、编辑或删除，删除探针会一并删除其扫描结果。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {brands.length > 0 ? (
            <Select value={brandId || undefined} onValueChange={onBrandChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="选择品牌" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button onClick={openCreate} disabled={!brandId}>
            <Plus />
            新增探针
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>类型</TableHead>
              <TableHead>探针</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : prompts.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                        {brands.length === 0 ? (
                          <>
                            请先在{" "}
                            <Link href="/brands" className="text-foreground underline-offset-4 hover:underline">
                              品牌
                            </Link>{" "}
                            页添加品牌，再生成或创建探针。
                          </>
                        ) : selectedBrandName ? (
                          `「${selectedBrandName}」还没有探针。`
                        ) : (
                          "还没有探针。"
                        )}
                      </TableCell>
                    </TableRow>
                  )
                : prompts.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant={row.category}>{CATEGORY_META[row.category].label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[42rem]">
                        <p className="truncate" title={row.text}>
                          {row.text}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleting(row)}
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

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!open && !saving) setCreating(false);
        }}
      >
        <DialogContent
          onPointerDownOutside={(event) => {
            if (saving) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>新增探针</DialogTitle>
            <DialogDescription>
              {selectedBrandName
                ? `下次扫描「${selectedBrandName}」时会包含这条探针。`
                : "下次扫描该品牌时会包含这条探针。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>类型</Label>
              <CategoryToggle value={draftCategory} onChange={setDraftCategory} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-prompt">探针</Label>
              <Textarea
                id="new-prompt"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                className="min-h-[96px]"
                placeholder="例如：AI 搜索可见性最好的工具有哪些？"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={saving} onClick={() => setCreating(false)}>
                取消
              </Button>
              <Button onClick={() => void saveCreate()} disabled={saving || !draftText.trim()}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {saving ? "添加中…" : "新增探针"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !saving) setEditing(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(event) => {
            if (saving) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>编辑探针</DialogTitle>
            <DialogDescription>
              {editing ? `「${editing.brand.name}」下保存的探针。` : "编辑这条探针。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>类型</Label>
              <CategoryToggle value={draftCategory} onChange={setDraftCategory} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prompt">探针</Label>
              <Textarea
                id="edit-prompt"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                className="min-h-[96px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button onClick={() => void saveEdit()} disabled={saving || !draftText.trim()}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !saving) setDeleting(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(event) => {
            if (saving) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>删除探针？</DialogTitle>
            <DialogDescription>
              将删除该探针及其全部扫描结果
              {deleting ? `（品牌：${deleting.brand.name}）` : ""}。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setDeleting(null)}>
              取消
            </Button>
            <Button variant="destructive" disabled={saving} onClick={() => void confirmDelete()}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {saving ? "删除中…" : "删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}