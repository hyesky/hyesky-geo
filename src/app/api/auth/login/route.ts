import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, jsonError } from "@/lib/api";
import { attachSession, isSetupComplete, verifyAdminPassword } from "@/lib/auth";
import { clientKey, consumeRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!(consumeRateLimit(`login:${clientKey(request)}`))) {
      return jsonError("尝试次数过多，请几分钟后再试。", 429);
    }
    if (!(await isSetupComplete())) {
      return jsonError("初始化未完成。", 409);
    }
    const payload = schema.parse(await request.json());
    const ok = await verifyAdminPassword(payload.password);
    if (!ok) return jsonError("密码无效。", 401);
    const response = NextResponse.json({ ok: true });
    return attachSession(response);
  } catch (error) {
    return jsonError(errorMessage(error, "无法登录。"), 400);
  }
}
