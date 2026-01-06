// apps/user/app/results/running/page.tsx
import * as React from "react";
import ResultsRunningClient from "./ResultsRunningClient";

// running は taskId クエリ依存 + 実行時に評価を走らせるページなので静的生成させない
export const dynamic = "force-dynamic";

export default function ResultsRunningPage() {
  return (
    <React.Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-10" data-testid="results-running-page">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">判定中…</h1>
            <p className="text-sm text-muted-foreground">結果ページに切り替わるまで少し待ってね。</p>
          </div>
          <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">running…</div>
        </main>
      }
    >
      <ResultsRunningClient />
    </React.Suspense>
  );
}
