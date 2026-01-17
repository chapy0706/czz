// apps/user/app/debug/auth/page.tsx
import { AuthStatusCard } from "@/components/auth/AuthStatusCard";

export const runtime = "nodejs";

export default function DebugAuthPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-xl font-bold">Auth Debug</h1>
      <p className="text-sm text-muted-foreground">
        ここで「ログインできているか」と「DBの users
        に同期できたか」を確認する。
      </p>
      <AuthStatusCard />
    </main>
  );
}
