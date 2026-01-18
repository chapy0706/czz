// apps/user/app/tasks/[taskId]/page.tsx
"use client";

import { CommandBuilder } from "@/lib/command-builder/CommandBuilder";
import { PseudoTerminalRunner } from "@/lib/terminal/PseudoTerminalRunner";
import { getOrCreateGuestUserId } from "@/lib/terminal/guestUserId";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { useEffect, useMemo, useState } from "react";

type TaskMeta = {
  title?: string;
  description?: string;
};

function pickMeta(json: unknown): TaskMeta | null {
  if (!json || typeof json !== "object") return null;

  // shape A: { ok: true, task: {...} }
  const anyJson = json as any;
  const src =
    anyJson.task && typeof anyJson.task === "object" ? anyJson.task : anyJson;

  const title = typeof src?.title === "string" ? src.title : undefined;
  const description =
    typeof src?.description === "string" ? src.description : undefined;

  return { title, description };
}

function pickErrorMessage(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const anyJson = json as any;

  if (
    anyJson?.error &&
    typeof anyJson.error === "object" &&
    typeof anyJson.error.message === "string"
  ) {
    return anyJson.error.message;
  }
  if (typeof anyJson?.message === "string") return anyJson.message;

  return null;
}

export default function TaskDetailPage({
  params,
}: {
  params: { taskId: string };
}) {
  const { taskId } = params;

  const uiMode = useUiModeStore((s) => s.mode);
  const isBeginner = uiMode === "beginner";

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(getOrCreateGuestUserId());
  }, []);

  const [meta, setMeta] = useState<TaskMeta>({});
  const [metaStatus, setMetaStatus] = useState<"idle" | "loading" | "ready">(
    "idle",
  );
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    async function load() {
      setMetaStatus("loading");
      setMetaError(null);

      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: ac.signal,
        });

        const json = (await res.json().catch(() => null)) as unknown;

        if (cancelled) return;

        if (!res.ok) {
          const msg =
            pickErrorMessage(json) ?? `Task fetch failed: ${res.status}`;
          setMeta({});
          setMetaError(msg);
          setMetaStatus("ready");
          return;
        }

        const picked = pickMeta(json);

        // title/description が無ければ、APIかseedのどちらかが期待と違う
        if (!picked?.title && !picked?.description) {
          setMeta({});
          setMetaError(
            "Task meta missing (title/description). seed / api response を確認してね。",
          );
          setMetaStatus("ready");
          return;
        }

        setMeta(picked ?? {});
        setMetaStatus("ready");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Unknown error";
        setMeta({});
        setMetaError(msg);
        setMetaStatus("ready");
      }
    }

    void load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [taskId]);

  const title = useMemo(() => {
    const t = (meta.title ?? "").trim();
    if (t) return t;

    if (metaStatus === "loading")
      return isBeginner ? "課題を読み込み中…" : "Loading task…";
    return isBeginner ? "課題タイトル（準備中）" : "Task title (placeholder)";
  }, [meta.title, metaStatus, isBeginner]);

  const description = useMemo(() => {
    const d = (meta.description ?? "").trim();
    if (d) return d;

    return isBeginner
      ? "ここに問題文が表示されるよ。いまはUIづくり中なので、あとで入る予定。"
      : "Problem statement placeholder.";
  }, [meta.description, isBeginner]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold" data-testid="task-title">
          {title}
        </h1>

        <div
          className="rounded border bg-card p-4 text-sm leading-6"
          data-testid="task-problem"
        >
          {metaError ? (
            <div className="space-y-2">
              <p className="text-destructive">
                問題文の取得に失敗: {metaError}
              </p>
              <p className="text-muted-foreground">
                DevTools の Network で <code>/api/tasks/{taskId}</code>{" "}
                のレスポンスを見て、
                <code>title</code>/<code>description</code>{" "}
                が入っているか確認してね。
              </p>
              <p className="text-muted-foreground">
                seed を更新した場合は、DB に反映するために seed
                を再実行する必要があるよ（migration は不要）。
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </section>

      <section className="space-y-2" data-testid="pipeline-workspace">
        <div className="text-sm text-muted-foreground">
          {isBeginner
            ? "コマンドをえらんで、ならべて、実行してみよう。"
            : "コマンドを並べて実行する。"}
        </div>
        <CommandBuilder taskId={taskId} />
      </section>

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
