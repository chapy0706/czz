// apps/user/app/results/[resultId]/page.tsx
"use client";

import type { EvaluateResponse } from "@/lib/terminal/evaluateContract";
import { ResultPanel } from "@/lib/terminal/ResultPanel";
import { useTerminalResultCacheStore } from "@/lib/terminal/terminalStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type ResultPanelProps = React.ComponentProps<typeof ResultPanel>;
type ResultStatus = ResultPanelProps["status"];

function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(
      x,
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    );
  } catch {
    return String(x);
  }
}

function extractText(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);

  if (typeof x === "object") {
    const any = x as Record<string, unknown>;
    const stdout = typeof any.stdout === "string" ? any.stdout : "";
    const stderr = typeof any.stderr === "string" ? any.stderr : "";
    const output = typeof any.output === "string" ? any.output : "";

    const blocks: string[] = [];
    if (output) blocks.push(output);
    if (stdout) blocks.push(`stdout:\n${stdout}`);
    if (stderr) blocks.push(`stderr:\n${stderr}`);
    if (blocks.length > 0) return blocks.join("\n\n");
  }
  return safeStringify(x);
}

function toResultPanelProps(
  res: EvaluateResponse
): Pick<ResultPanelProps, "status" | "outputText" | "expectedText" | "hint"> {
  const ok = res.ok;
  const passed =
    typeof (res as any)?.passed === "number" ? (res as any).passed : 0;
  const total =
    typeof (res as any)?.total === "number" ? (res as any).total : 0;

  const isAllPassed = ok && total >= 0 && passed === total;
  const status: ResultStatus = isAllPassed ? "success" : "failure";

  if (ok) {
    const outputText = extractText((res as any).output);
    const hint =
      isAllPassed || total === 0
        ? undefined
        : { title: "Test summary", detail: `passed ${passed} / ${total}` };
    return { status, outputText, expectedText: undefined, hint };
  }

  const err = (res as any)?.error;
  const kind = typeof err?.kind === "string" ? err.kind : "UNKNOWN";
  const msg = typeof err?.message === "string" ? err.message : "Unknown error";
  const details = err?.details != null ? `\n\n${extractText(err.details)}` : "";

  return {
    status: "failure",
    outputText: `${kind}: ${msg}${details}`,
    expectedText: undefined,
    hint: { title: "Error", detail: `${kind}: ${msg}` },
  };
}

export default function ResultByIdPage({
  params,
}: {
  params: { resultId: string };
}) {
  const router = useRouter();
  const { resultId } = params;

  const entry = useTerminalResultCacheStore((s) => s.byId[resultId] ?? null);
  const remove = useTerminalResultCacheStore((s) => s.remove);

  const panelProps = React.useMemo(
    () => (entry ? toResultPanelProps(entry.response) : null),
    [entry]
  );

  const savedAtText = React.useMemo(() => {
    if (!entry) return "";
    try {
      return new Date(entry.savedAt).toLocaleString();
    } catch {
      return String(entry.savedAt);
    }
  }, [entry]);

  const taskId = entry?.meta?.taskId;

  const onRetry = React.useCallback(() => {
    router.push(taskId ? `/tasks/${taskId}` : "/tasks");
  }, [router, taskId]);

  const onBackToTasks = React.useCallback(() => {
    router.push("/tasks");
  }, [router]);

  return (
    <main
      className="mx-auto max-w-5xl px-6 py-10"
      data-testid="results-by-id-page"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">リザルト</h1>
          <p className="text-sm text-muted-foreground">
            resultId: <span className="font-mono">{resultId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="text-sm text-muted-foreground hover:underline"
          >
            課題一覧へ
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            TOPへ
          </Link>
        </div>
      </div>

      {!entry || !panelProps ? (
        <div className="mt-6 space-y-3">
          <div
            className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground"
            data-testid="results-not-found"
          >
            この resultId
            の結果が見つからない。別タブ/別ブラウザだと共有できないことがある。
          </div>
          <div className="flex items-center gap-3 text-sm">
            {taskId ? (
              <Link
                href={`/tasks/${taskId}`}
                className="text-muted-foreground hover:underline"
              >
                タスクへ戻る
              </Link>
            ) : (
              <Link
                href="/tasks"
                className="text-muted-foreground hover:underline"
              >
                課題一覧へ
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div data-testid="results-saved-at">savedAt: {savedAtText}</div>
            <button
              type="button"
              className="rounded border bg-background px-3 py-1 hover:bg-accent"
              onClick={() => remove(resultId)}
              data-testid="results-remove"
            >
              この結果を削除
            </button>
          </div>

          <ResultPanel
            status={panelProps.status}
            outputText={panelProps.outputText}
            expectedText={panelProps.expectedText}
            hint={panelProps.hint}
            onRetry={onRetry}
            onBackToTasks={onBackToTasks}
          />
        </div>
      )}
    </main>
  );
}
