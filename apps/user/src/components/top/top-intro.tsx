// apps/user/src/components/top/top-intro.tsx

"use client";

import { TopTitle } from "@/components/top/top-title";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

export function TopIntro() {
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  return (
    <>
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded border bg-background px-2 py-1">czz</span>
        {!isBeginner && <span>指示厨が課題を解決するゲーム</span>}
      </div>

      <TopTitle />

      {!isBeginner && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          UNIX 的な「流れ」を、UI
          で組み立てて学ぶゲーム。コマンドを並べて実行し、テストで確かめる。
        </p>
      )}
    </>
  );
}
