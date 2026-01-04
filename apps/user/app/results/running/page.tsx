// apps/user/app/results/running/page.tsx
"use client";

import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { EvaluateResponseSchema, type EvaluateResponse } from "@/lib/terminal/evaluateContract";
import { persistResult } from "@/lib/terminal/terminalStore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

function normalizeNetworkError(message: string, details?: unknown): EvaluateResponse {
  return { ok: false, error: { kind: "NETWORK", message, details } };
}

async function postEvaluate(taskId: string, submittedProgram: unknown): Promise<EvaluateResponse> {
  try {
    const res = await fetch(`/api/tasks/${taskId}/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submittedProgram }),
    });

    const json = await res.json().catch(() => null);
    const parsed = EvaluateResponseSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: { kind: "UNKNOWN", message: "Invalid API response", details: parsed.error.flatten() } };
    }
    return parsed.data;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return normalizeNetworkError(message, e);
  }
}

export default function ResultsRunningPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const taskId = sp.get("taskId") ?? "";

  const [state, setState] = React.useState<"idle" | "running" | "error">("idle");
  const [errText, setErrText] = React.useState<string>("");

  const ranRef = React.useRef(false);

  React.useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!taskId) {
      setState("error");
      setErrText("taskId が指定されていない。タスク画面から実行してね。");
      return;
    }

    const program = useCommandBuilderStore.getState().serializeProgram();
    const commands = (program as any)?.commands;
    if (!Array.isArray(commands) || commands.length === 0) {
      setState("error");
      setErrText("コマンドが空だった。タスク画面でコマンドを選んでから実行してね。");
      return;
    }

    setState("running");

    (async () => {
      const evaluated = await postEvaluate(taskId, program);
      const resultId = persistResult(evaluated, { taskId });
      router.replace(`/results/${resultId}`);
    })().catch((e) => {
      setState("error");
      setErrText(e instanceof Error ? e.message : "Unknown error");
    });
  }, [router, taskId]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10" data-testid="results-running-page">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">判定中…</h1>
        <p className="text-sm text-muted-foreground">結果ページに切り替わるまで少し待ってね。</p>
      </div>

      {state === "running" ? (
        <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">running…</div>
      ) : state === "error" ? (
        <div className="mt-6 space-y-3">
          <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground" data-testid="results-running-error">
            {errText}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/tasks" className="text-muted-foreground hover:underline">課題一覧へ</Link>
            {taskId ? <Link href={`/tasks/${taskId}`} className="text-muted-foreground hover:underline">タスクへ戻る</Link> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
