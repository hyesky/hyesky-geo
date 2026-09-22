import { PrismaClient } from "@prisma/client";
import { buildDefaultPrompts } from "../src/lib/prompts";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.brand.findFirst();
  if (existing) {
    console.log(`Seed skipped: brand "${existing.name}" already exists.`);
    return;
  }

  const brand = await prisma.brand.create({
    data: {
      name: "Hyesky",
      targetDomain: "hyesky.com",
      aliases: ["Hyesky", "hyesky-geo"],
      industryCategory: "AI 搜索可见性监控",
      description: "监控 ChatGPT、Perplexity、Gemini、DeepSeek、智谱、Kimi、豆包、混元等引擎是否引用我的域名",
      language: "zh",
      competitors: ["Profound", "Goodie AI", "Peec AI"],
    },
  });

  const prompts = buildDefaultPrompts({
    name: brand.name,
    industryCategory: brand.industryCategory,
    description: brand.description,
    competitors: brand.competitors,
    language: brand.language,
  });

  await prisma.prompt.createMany({
    data: prompts.map((prompt) => ({
      brandId: brand.id,
      text: prompt.text,
      category: prompt.category,
    })),
  });

  console.log(`Seeded brand ${brand.id} with ${prompts.length} prompts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
