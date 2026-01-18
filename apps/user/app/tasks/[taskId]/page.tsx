// apps/user/app/tasks/[taskId]/page.tsx
"use client";

import { CommandBuilder } from "@/lib/command-builder/CommandBuilder";
import { PseudoTerminalRunner } from "@/lib/terminal/PseudoTerminalRunner";
import { getOrCreateGuestUserId } from "@/lib/terminal/guestUserId";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TaskMeta = {
  id: string;
  title: string;
  description: string;
};

async function fetchTaskMeta(taskId: string): Promise<TaskMeta> {
  const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Task fetch failed: ${res.status}`);

  const json = (await res.json()) as any;
  if (!json?.ok) throw new Error("Task fetch failed");

  return json.value as TaskMeta;
}

export default function TaskPage() {
  const params = useParams();
  const raw = (params as any)?.taskId as string | string[] | undefined;
  const taskId = Array.isArray(raw) ? raw[0] : raw;

  if (!taskId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">Task</div>
          <div className="mt-2 text-sm">
            Invalid route params (taskId not found)
          </div>
        </div>
      </div>
    );
  }

  return <TaskPageClient taskId={taskId} />;
}

function TaskPageClient({ taskId }: { taskId: string }) {
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  const [meta, setMeta] = useState<TaskMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(() => getOrCreateGuestUserId(), []);

  useEffect(() => {
    let alive = true;
    setMeta(null);
    setError(null);

    fetchTaskMeta(taskId)
      .then((m) => {
        if (!alive) return;
        setMeta(m);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e?.message ?? e));
      });

    return () => {
      alive = false;
    };
  }, [taskId]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 rounded-2xl border bg-card p-4">
        <div className="text-sm text-muted-foreground">
          {isBeginner ? "もんだい" : "Task"}
        </div>
        <div className="text-xl font-semibold">
          {meta?.title ?? "読み込み中…"}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {error
            ? `問題文の取得に失敗: ${error}`
            : (meta?.description ?? "読み込み中…")}
        </div>
      </div>

      {/* ✅ taskId 必須 */}
      <CommandBuilder taskId={taskId} />

      {/* 初心者モードでは Runner/Debug を出さない */}
      {!isBeginner ? (
        <details
          className="mt-6 rounded-2xl border bg-card p-4"
          data-testid="debug-drawer"
        >
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Debug
          </summary>
          <div className="mt-3">
            <PseudoTerminalRunner taskId={taskId} userId={userId} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
