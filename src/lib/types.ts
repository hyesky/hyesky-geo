import type { Engine, PromptCategory } from "@prisma/client";

export const PROVIDER_IDS = [
  "perplexity",
  "openai",
  "gemini",
  "deepseek",
  "qwen",
  "zhipu",
  "kimi",
  "doubao",
  "hunyuan",
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];
export type ApiKeys = Record<ProviderId, string>;
export type KeyHints = Record<ProviderId, string | null>;
export type EngineId = Engine;

export function emptyKeys(): ApiKeys {
  return {
    perplexity: "",
    openai: "",
    gemini: "",
    deepseek: "",
    qwen: "",
    zhipu: "",
    kimi: "",
    doubao: "",
    hunyuan: "",
  };
}

export function emptyHints(): KeyHints {
  return {
    perplexity: null,
    openai: null,
    gemini: null,
    deepseek: null,
    qwen: null,
    zhipu: null,
    kimi: null,
    doubao: null,
    hunyuan: null,
  };
}

export type QueueItem = {
  id: string;
  promptId: string;
  promptText: string;
  engine: EngineId;
};

export type QueueStatus = "idle" | "queued" | "running" | "success" | "error";

export type QueueProgress = {
  item: QueueItem;
  status: QueueStatus;
  error?: string;
};

export type ParsedVisibility = {
  is_mentioned: boolean;
  has_citation: boolean;
  rank_position: number;
  cited_domains: string[];
};

export type EngineOutput = {
  engine: EngineId;
  text: string;
  citations: string[];
};

export type BrandInput = {
  name: string;
  targetDomain: string;
  aliases: string[];
  competitors: string[];
  industryCategory?: string | null;
  description?: string | null;
  language: string;
};

export type PromptInput = {
  text: string;
  category: PromptCategory;
};

export const ENGINE_META: Record<
  EngineId,
  { label: string; model: string; accent: string; placeholder: string; docs: string }
> = {
  perplexity: {
    label: "Perplexity",
    model: "sonar",
    accent: "text-foreground",
    placeholder: "pplx-...",
    docs: "https://www.perplexity.ai/settings/api",
  },
  openai: {
    label: "OpenAI",
    model: "gpt-4o",
    accent: "text-foreground",
    placeholder: "sk-...",
    docs: "https://platform.openai.com/api-keys",
  },
  gemini: {
    label: "Gemini",
    model: "gemini-3.6-flash",
    accent: "text-foreground",
    placeholder: "AIza...",
    docs: "https://aistudio.google.com/apikey",
  },
  deepseek: {
    label: "DeepSeek",
    model: "deepseek-chat",
    accent: "text-foreground",
    placeholder: "sk-...",
    docs: "https://platform.deepseek.com/api_keys",
  },
  qwen: {
    label: "Qwen",
    model: "qwen-plus",
    accent: "text-foreground",
    placeholder: "sk-...",
    docs: "https://bailian.console.aliyun.com/",
  },
  zhipu: {
    label: "智谱 GLM",
    model: "glm-4-flash",
    accent: "text-foreground",
    placeholder: "xxxxx.xxxxx",
    docs: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  kimi: {
    label: "Kimi 月之暗面",
    model: "moonshot-v1-8k",
    accent: "text-foreground",
    placeholder: "sk-...",
    docs: "https://platform.moonshot.cn/console/api-keys",
  },
  doubao: {
    label: "豆包(火山方舟)",
    model: "doubao-seed-1-6-250615",
    accent: "text-foreground",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    docs: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
  },
  hunyuan: {
    label: "腾讯混元",
    model: "hunyuan-turbo-latest",
    accent: "text-foreground",
    placeholder: "sk-...",
    docs: "https://console.cloud.tencent.com/hunyuan/api-key",
  },
};

export const CATEGORY_META: Record<PromptCategory, { label: string; dotClass: string }> = {
  brand: { label: "品牌", dotClass: "bg-blue-500" },
  category: { label: "品类", dotClass: "bg-violet-500" },
  competitor: { label: "竞品", dotClass: "bg-red-500" },
  scenario: { label: "场景", dotClass: "bg-teal-500" },
};

export const PROBE_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
] as const;

export type ProbeLanguage = (typeof PROBE_LANGUAGES)[number]["id"];

export function probeLanguage(value: string | null | undefined): ProbeLanguage {
  const code = value?.trim().toLowerCase() ?? "";
  if (code.startsWith("zh")) return "zh";
  if (code.startsWith("fr")) return "fr";
  if (code.startsWith("es")) return "es";
  return "en";
}

export function probeLanguageLabel(value: string | null | undefined) {
  const id = probeLanguage(value);
  return PROBE_LANGUAGES.find((item) => item.id === id)?.label ?? "English";
}

export const KEYS_STORAGE_KEY = "opencitex.byok.keys";
export const ACTIVE_BRAND_KEY = "opencitex.activeBrandId";
export const ACTIVE_PROJECT_KEY = "opencitex.activeProjectId";
export const QUEUE_DELAY_MS = 850;
export const DEFAULT_PACE_MS = 1000;
export const MIN_PACE_SEC = 0;
export const MAX_PACE_SEC = 60;

export type ProviderPaceMs = Record<ProviderId, number>;

export function emptyPaceMs(): ProviderPaceMs {
  return {
    perplexity: DEFAULT_PACE_MS,
    openai: DEFAULT_PACE_MS,
    gemini: DEFAULT_PACE_MS,
    deepseek: DEFAULT_PACE_MS,
    qwen: DEFAULT_PACE_MS,
    zhipu: DEFAULT_PACE_MS,
    kimi: DEFAULT_PACE_MS,
    doubao: DEFAULT_PACE_MS,
    hunyuan: DEFAULT_PACE_MS,
  };
}

export function normalizePaceMs(value: unknown): ProviderPaceMs {
  const next = emptyPaceMs();
  if (!value || typeof value !== "object") return next;
  const raw = value as Record<string, unknown>;
  for (const id of PROVIDER_IDS) {
    const ms = Number(raw[id]);
    if (!Number.isFinite(ms)) continue;
    next[id] = Math.round(Math.min(MAX_PACE_SEC * 1000, Math.max(MIN_PACE_SEC * 1000, ms)));
  }
  return next;
}

/** Chat models used when classifying scan answers. No web search. */
export const ANALYZER_MODELS: Record<ProviderId, string> = {
  perplexity: "sonar",
  openai: "gpt-4o-mini",
  gemini: "gemini-3.6-flash",
  deepseek: "deepseek-chat",
  qwen: "qwen-plus",
  zhipu: "glm-4-flash",
  kimi: "moonshot-v1-8k",
  doubao: "doubao-seed-1-6-250615",
  hunyuan: "hunyuan-turbo-latest",
};

export function normalizeAnalyzer(value: unknown): ProviderId | null {
  if (typeof value !== "string") return null;
  return PROVIDER_IDS.includes(value as ProviderId) ? (value as ProviderId) : null;
}
