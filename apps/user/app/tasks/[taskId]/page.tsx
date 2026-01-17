// apps/user/app/tasks/[taskId]/page.tsx
"use client";

import { CommandBuilder } from "@/lib/command-builder/CommandBuilder";
import { PseudoTerminalRunner } from "@/lib/terminal/PseudoTerminalRunner";
import { getOrCreateGuestUserId } from "@/lib/terminal/guestUserId";
import { useEffect, useState, use } from "react";

export default function TaskDetailPage(props: { params: Promise<{ taskId: string }> }) {
  const params = use(props.params);
  const taskId = params.taskId;

  // デバッグ用途（必要な人だけ開く）
  // SSR 初回レンダと hydration 差を避けるため client で確定
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(getOrCreateGuestUserId());
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* 1) 問題文（将来 API で title/description を取れるようにする。いまは杭だけ先に固定） */}
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">Task</h1>
        <div
          className="rounded border bg-card p-4 text-sm leading-6"
          data-testid="task-problem"
          aria-label="task problem"
        >
          <p className="text-muted-foreground">
            問題文はここに表示する。いまは UI 再設計のためのプレースホルダ。
          </p>
        </div>
      </section>

      {/* 2) Pipeline Panel（正規ルート） */}
      <section
        className="space-y-2"
        data-testid="pipeline-workspace"
        aria-label="pipeline workspace"
      >
        {/* NOTE: ここが今後「Terminal / Runner」などの名称になる想定 */}
        <CommandBuilder taskId={taskId} />
      </section>

      {/* 3) Debug（必要なら）: Pseudo Terminal / userId はここに隔離 */}
      <details className="rounded border bg-muted/20 p-3" data-testid="debug-drawer">
        <summary className="cursor-pointer text-sm text-muted-foreground">Debug</summary>

        <div className="mt-3 space-y-2">
          <div className="text-xs text-muted-foreground break-all">taskId: {taskId}</div>
          <div className="text-xs text-muted-foreground break-all">
            guest userId: {userId ?? "(loading)"}
          </div>

          <div className="mt-2">
            <div className="mb-2 text-sm font-semibold">Pseudo Terminal</div>
            {userId ? (
              <PseudoTerminalRunner taskId={taskId} userId={userId} />
            ) : (
              <div className="rounded border p-3 text-sm text-muted-foreground">
                Initializing...
              </div>
            )}
          </div>
        </div>
      </details>
    </main>
  );
}
