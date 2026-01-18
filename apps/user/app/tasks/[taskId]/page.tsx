// apps/user/app/tasks/[taskId]/page.tsx
"use client";

import { CommandBuilder } from "@/lib/command-builder/CommandBuilder";
import { PseudoTerminalRunner } from "@/lib/terminal/PseudoTerminalRunner";
import { getOrCreateGuestUserId } from "@/lib/terminal/guestUserId";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { use, useEffect, useMemo, useState } from "react";

type TaskMeta = {
  title?: string;
  description?: string;
};

function safePickTaskMeta(json: any): TaskMeta {
  // 想定: { task: { title, description } } / { title, description } どちらでも拾えるようにする
  const src = json?.task && typeof json.task === "object" ? json.task : json;
  const title = typeof src?.title === "string" ? src.title : undefined;
  const description =
    typeof src?.description === "string" ? src.description : undefined;
  return { title, description };
}

export default function TaskDetailPage(props: {
  params: Promise<{ taskId: string }>;
}) {
  const params = use(props.params);
  const taskId = params.taskId;

  const uiMode = useUiModeStore((s) => s.mode);
  const isBeginner = uiMode === "beginner";

  // デバッグ用途（必要な人だけ開く）
  // SSR 初回レンダと hydration 差を避けるため client で確定
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(getOrCreateGuestUserId());
  }, []);

  // Task meta（タイトル/説明）。API が無くても壊れないように “あれば拾う”
  const [meta, setMeta] = useState<TaskMeta>({});
  const [metaStatus, setMetaStatus] = useState<"idle" | "loading" | "ready">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setMetaStatus("loading");

      try {
        // まずは一般的な REST 形を試す（存在しないなら 404 で無視する）
        const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setMetaStatus("ready");
          return;
        }

        const json = await res.json().catch(() => null);
        const picked = safePickTaskMeta(json);

        if (!cancelled) {
          setMeta(picked);
          setMetaStatus("ready");
        }
      } catch {
        if (!cancelled) setMetaStatus("ready");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const title = useMemo(() => {
    if (meta.title) return meta.title;
    if (metaStatus === "loading")
      return isBeginner ? "課題を読み込み中…" : "Loading task…";
    return isBeginner ? "課題タイトル（準備中）" : "Task (placeholder)";
  }, [meta.title, metaStatus, isBeginner]);

  const description = useMemo(() => {
    if (meta.description) return meta.description;
    return isBeginner
      ? "ここに問題文が表示されるよ。いまはUIづくり中なので、あとで入る予定。"
      : "問題文はここに表示する。いまは UI 再設計のためのプレースホルダ。";
  }, [meta.description, isBeginner]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* 1) 問題文 */}
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div
          className="rounded border bg-card p-4 text-sm leading-6"
          data-testid="task-problem"
          aria-label="task problem"
        >
          <p className="text-muted-foreground">{description}</p>
        </div>
      </section>

      {/* 2) Pipeline Panel（正規ルート） */}
      <section
        className="space-y-2"
        data-testid="pipeline-workspace"
        aria-label="pipeline workspace"
      >
        <div className="text-sm text-muted-foreground">
          {isBeginner
            ? "コマンドをえらんで、ならべて、実行してみよう。"
            : "コマンドを並べて実行する。"}
        </div>
        <CommandBuilder taskId={taskId} />
      </section>

      {/* 3) Debug（必要なら） */}
      <details
        className="rounded border bg-muted/20 p-3"
        data-testid="debug-drawer"
      >
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Debug
        </summary>

        <div className="mt-3 space-y-2">
          <div className="text-xs text-muted-foreground break-all">
            taskId: {taskId}
          </div>
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
