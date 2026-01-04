// apps/user/app/result/page.tsx
"use client";

import { useTerminalResultCacheStore } from "@/lib/terminal/terminalStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function ResultAliasPage() {
  const router = useRouter();
  const latestId = useTerminalResultCacheStore((s) => s.latestId);

  React.useEffect(() => {
    if (!latestId) return;
    router.replace(`/results/${latestId}`);
  }, [router, latestId]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10" data-testid="result-page">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">リザルト</h1>
        <p className="text-sm text-muted-foreground">直近の実行結果へ案内するページ。</p>
      </div>

      {!latestId ? (
        <div className="mt-6 space-y-3">
          <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground" data-testid="result-empty">
            まだリザルトがないよ。タスクを実行してから戻ってきてね。
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/tasks" className="text-muted-foreground hover:underline">課題一覧へ</Link>
            <Link href="/" className="text-muted-foreground hover:underline">TOPへ</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">リダイレクト中…</div>
      )}
    </main>
  );
}
