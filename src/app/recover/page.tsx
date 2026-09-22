"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth/auth-frame";
import { RecoveryCodePanel } from "@/components/auth/recovery-code-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export default function RecoverPage() {
  const router = useRouter();
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [nextCode, setNextCode] = useState<string | null>(null);

  useEffect(() => {
    async function boot() {
      const response = await fetch("/api/auth/status");
      const payload = (await response.json()) as { setupComplete?: boolean };
      if (!payload.setupComplete) router.replace("/setup");
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
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recoveryCode, password }),
      });
      const payload = (await response.json()) as { recoveryCode?: string; error?: string };
      if (!response.ok || !payload.recoveryCode) {
        throw new Error(payload.error || "重置失败。");
      }
      setNextCode(payload.recoveryCode);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "重置失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthFrame
      title="使用恢复码重置"
      description="旧恢复码使用后即失效，重置后会给你一个新恢复码。如果两个都丢了，需要在服务器上运行 npm run auth:reset。"
    >
      {nextCode ? (
        <RecoveryCodePanel code={nextCode} onContinue={() => window.location.assign("/dashboard")} />
      ) : (
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="space-y-2">
            <Label htmlFor="recovery">恢复码</Label>
            <Input
              id="recovery"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              className="font-mono"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">新密码</Label>
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
            <Label htmlFor="confirm">确认新密码</Label>
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
            {saving ? "重置中…" : "重置密码"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
              返回登录
            </Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
