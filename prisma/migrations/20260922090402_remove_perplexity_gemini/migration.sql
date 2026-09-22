/*
  Warnings:

  - The values [perplexity,gemini] on the enum `Engine` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Engine_new" AS ENUM ('openai', 'deepseek', 'qwen', 'zhipu', 'kimi', 'doubao', 'hunyuan');
ALTER TABLE "Job" ALTER COLUMN "engines" TYPE "Engine_new"[] USING ("engines"::text::"Engine_new"[]);
ALTER TABLE "Job" ALTER COLUMN "currentEngine" TYPE "Engine_new" USING ("currentEngine"::text::"Engine_new");
ALTER TABLE "Result" ALTER COLUMN "engine" TYPE "Engine_new" USING ("engine"::text::"Engine_new");
ALTER TYPE "Engine" RENAME TO "Engine_old";
ALTER TYPE "Engine_new" RENAME TO "Engine";
DROP TYPE "public"."Engine_old";
COMMIT;
