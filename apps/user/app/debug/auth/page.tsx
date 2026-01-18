// apps/user/app/debug/auth/page.tsx

import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuthDebugClient from "./AuthDebugClient";

/**
 * /debug/auth は「認証が動いているか」を見るための開発用ページ。
 *
 * Vercel の build では request-time の値（searchParams / cookies 等）が無い状態で
 * prerender（静的生成）しようとして落ちることがあるため、明示的に動的レンダリングに寄せる。
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DebugAuthPage() {
  // 本番では露出させない（Preview/Development だけでOK）
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Auth Debug</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Neon Auth のセッションと /api/me の挙動を確認するページ。
      </p>

      <div className="mt-6 rounded-lg border p-4">
        <Suspense fallback={<div className="text-sm">loading…</div>}>
          <AuthDebugClient />
        </Suspense>
      </div>
    </main>
  );
}
