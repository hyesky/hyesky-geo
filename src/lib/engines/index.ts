import {
  queryDeepSeek,
  queryDoubao,
  queryHunyuan,
  queryKimi,
  queryQwen,
  queryZhipu,
} from "@/lib/engines/compatible";
import { queryOpenAI } from "@/lib/engines/openai";
import type { ApiKeys, EngineId, EngineOutput } from "@/lib/types";

export async function queryEngine(
  engine: EngineId,
  keys: ApiKeys,
  prompt: string,
): Promise<EngineOutput> {
  switch (engine) {
    case "openai":
      if (!keys.openai) throw new Error("Missing OpenAI API key.");
      return queryOpenAI(keys.openai, prompt);
    case "deepseek":
      if (!keys.deepseek) throw new Error("Missing DeepSeek API key.");
      return queryDeepSeek(keys.deepseek, prompt);
    case "qwen":
      if (!keys.qwen) throw new Error("Missing Qwen API key.");
      return queryQwen(keys.qwen, prompt);
    case "zhipu":
      if (!keys.zhipu) throw new Error("Missing Zhipu API key.");
      return queryZhipu(keys.zhipu, prompt);
    case "kimi":
      if (!keys.kimi) throw new Error("Missing Kimi API key.");
      return queryKimi(keys.kimi, prompt);
    case "doubao":
      if (!keys.doubao) throw new Error("Missing Doubao API key.");
      return queryDoubao(keys.doubao, prompt);
    case "hunyuan":
      if (!keys.hunyuan) throw new Error("Missing Hunyuan API key.");
      return queryHunyuan(keys.hunyuan, prompt);
    default:
      throw new Error(`Unsupported engine: ${engine}`);
  }
}
