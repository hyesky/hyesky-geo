"use client";

import { PrintText } from "@/components/ui/print-text";

export function HeroCopy() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <PrintText text="开源 GEO 雷达" speed={22} />
      </p>
      <h1 className="mt-3 font-sans text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
        <PrintText
          text="看看 AI 问答引擎是否真的引用你。"
          speed={26}
          delay={350}
          reserveSpace
        />
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        <PrintText
          text="Hyesky GEO 使用你自己的密钥，向 OpenAI、DeepSeek、Qwen、智谱 GLM、Kimi、豆包、腾讯混元等引擎发起探针，然后统计提及率、引用率与竞品拦截率——让你看清生成式搜索在哪里抹掉了你的品牌。"
          speed={8}
          delay={1700}
          caret={false}
          reserveSpace
        />
      </p>
    </>
  );
}
