import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, jsonError } from "@/lib/api";
import { attachSession, resetAdminWithRecoveryCode } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { clientKey, consumeRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  recoveryCode: z.string().min(8),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`),
});

export async function POST(request: Request) {
  try {
    if (!(consumeRateLimit(`recover:${clientKey(request)}`))) {
      return jsonError("尝试次数过多，请几分钟后再试。", 429);
    }
    const payload = schema.parse(await request.json());
    const recoveryCode = await resetAdminWithRecoveryCode(payload.recoveryCode, payload.password);
    const response = NextResponse.json({ recoveryCode });
    return attachSession(response);
  } catch (error) {
    return jsonError(errorMessage(error, "无法重置密码。"), 400);
  }
}
