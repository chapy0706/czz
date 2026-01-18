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

function coerceTaskMeta(raw: unknown): TaskMeta {
  if (!raw || typeof raw !== "object") {
    throw new Error("Task payload is not an object");
  }
  const r = raw as any;

  const id = typeof r.id === "string" ? r.id : "";
  const title = typeof r.title === "string" ? r.title : undefined;
  const description =
    typeof r.description === "string" ? r.description : undefined;

  if (!id) {
    throw new Error(
      `Task payload missing id. keys=${Object.keys(r).join(",")}`,
    );
  }
  if (title === undefined) {
    throw new Error(
      `Task payload missing title. keys=${Object.keys(r).join(",")}`,
    );
  }
  if (description === undefined) {
    throw new Error(
      `Task payload missing description. keys=${Object.keys(r).join(",")}`,
    );
  }

  return { id, title, description };
}

async function fetchTaskMeta(taskId: string): Promise<TaskMeta> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Task fetch failed: ${res.status}${text ? ` (${text.slice(0, 120)})` : ""}`,
    );
  }

  const json = (await res.json()) as any;

  if (json?.ok !== true) {
    const msg =
      typeof json?.message === "string"
        ? json.message
        : typeof json?.error?.kind === "string"
          ? json.error.kind
          : "Task response not ok";
    throw new Error(msg);
  }

  // 想定: { ok:true, value:{...} }
  // でも実装差分があっても壊れないように吸収
  const payload = json?.value ?? json?.task ?? json?.value?.task;

  return coerceTaskMeta(payload);
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
          {error
            ? isBeginner
              ? "読み込みに失敗したよ"
              : "Failed to load"
            : (meta?.title ?? "読み込み中…")}
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          {error
            ? `問題文の取得に失敗: ${error}`
            : (meta?.description ?? "読み込み中…")}
        </div>
      </div>

      <CommandBuilder taskId={taskId} />

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
