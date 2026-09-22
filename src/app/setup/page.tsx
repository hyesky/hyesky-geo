"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth/auth-frame";
import { RecoveryCodePanel } from "@/components/auth/recovery-code-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export default function SetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  useEffect(() => {
    async function boot() {
      const response = await fetch("/api/auth/status");
      const payload = (await response.json()) as {
        setupComplete?: boolean;
        authenticated?: boolean;
      };
      if (payload.authenticated) {
        router.replace("/dashboard");
        return;
      }
      if (payload.setupComplete) router.replace("/login");
    }
    void boot();
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("两次输入的密码不一致。");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { recoveryCode?: string; error?: string };
      if (!response.ok || !payload.recoveryCode) {
        throw new Error(payload.error || "初始化失败。");
      }
      setRecoveryCode(payload.recoveryCode);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "初始化失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthFrame
      title="创建管理员密码"
      description="为这个实例设置一个密码。没有邮箱找回机制——下一步会给你一个恢复码。"
    >
      {recoveryCode ? (
        <RecoveryCodePanel code={recoveryCode} onContinue={() => window.location.assign("/dashboard")} />
      ) : (
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">确认密码</Label>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || password.length < 8}>
            {saving ? "保存中…" : "创建密码"}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}
