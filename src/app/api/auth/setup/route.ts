import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, jsonError } from "@/lib/api";
import { attachSession, createAdmin, isSetupComplete } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { clientKey, consumeRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`),
});

export async function POST(request: Request) {
  try {
    if (!(consumeRateLimit(`setup:${clientKey(request)}`))) {
      return jsonError("尝试次数过多，请几分钟后再试。", 429);
    }
    if (await isSetupComplete()) {
      return jsonError("管理员密码已设置。 Sign in instead.", 409);
    }
    const payload = schema.parse(await request.json());
    const recoveryCode = await createAdmin(payload.password);
    const response = NextResponse.json({ recoveryCode, setupComplete: true });
    return attachSession(response);
  } catch (error) {
    return jsonError(errorMessage(error, "无法完成初始化设置。"), 400);
  }
}
