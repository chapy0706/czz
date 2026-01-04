// apps/user/app/result/page.tsx
"use client";

import { ResultPanel } from "@/lib/terminal/ResultPanel";
import { EvaluateResponseSchema, type EvaluateResponse } from "@/lib/terminal/evaluateContract";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

const LAST_RESULT_STORAGE_KEY = "czz-terminal-last-result";

type ResultPanelProps = React.ComponentProps<typeof ResultPanel>;
type ResultStatus = ResultPanelProps["status"];

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
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

  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

type StoredLastResult = {
  savedAt: number;
  meta?: { taskId?: string };
  response: unknown;
};

function toPanelProps(res: EvaluateResponse): Pick<ResultPanelProps, "status" | "outputText" | "expectedText" | "hint"> {
  const ok = res.ok;

  const passed = typeof (res as any)?.passed === "number" ? (res as any).passed : 0;
  const total = typeof (res as any)?.total === "number" ? (res as any).total : 0;

  const isAllPassed = ok && total >= 0 && passed === total;
  const status: ResultStatus = isAllPassed ? "success" : "failure";

  if (ok) {
    const outputText = extractText((res as any).output);
    const hint =
      isAllPassed || total === 0 ? undefined : { title: "Test summary", detail: `passed ${passed} / ${total}` };

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

export default function ResultPage() {
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [stored, setStored] = React.useState<StoredLastResult | null>(null);
  const [panel, setPanel] = React.useState<
    Pick<ResultPanelProps, "status" | "outputText" | "expectedText" | "hint"> | null
  >(null);

  React.useEffect(() => {
    if (!mounted) return;

    const raw = safeParse(localStorage.getItem(LAST_RESULT_STORAGE_KEY)) as StoredLastResult | null;
    if (!raw || typeof raw !== "object") {
      setStored(null);
      setPanel(null);
      return;
    }

    setStored(raw);

    const parsed = EvaluateResponseSchema.safeParse(raw.response);
    if (!parsed.success) {
      setPanel({
        status: "failure",
        outputText: "Invalid stored result (schema mismatch).",
        expectedText: undefined,
        hint: { title: "Storage", detail: parsed.error.message },
      });
      return;
    }

    setPanel(toPanelProps(parsed.data));
  }, [mounted]);

  const savedAtText = React.useMemo(() => {
    if (!stored) return "";
    try {
      return new Date(stored.savedAt).toLocaleString();
    } catch {
      return String(stored.savedAt);
    }
  }, [stored]);

  const taskId = stored?.meta?.taskId;

  const clear = React.useCallback(() => {
    try {
      localStorage.removeItem(LAST_RESULT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setStored(null);
    setPanel(null);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10" data-testid="result-page">
      <div className="flex items-baseline justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">リザルト</h1>
          <p className="text-sm text-muted-foreground">直近の実行結果（localStorage 保存）を表示する。</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tasks" className="text-sm text-muted-foreground hover:underline">
            課題一覧へ
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            TOPへ
          </Link>
        </div>
      </div>

      {!mounted ? (
        <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">読み込み中…</div>
      ) : !panel ? (
        <div className="mt-6 space-y-3">
          <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground" data-testid="result-empty">
            まだリザルトがないよ。タスクを実行してから戻ってきてね。
          </div>
          <div className="flex items-center gap-3 text-sm">
            {taskId ? (
              <Link href={`/tasks/${taskId}`} className="text-muted-foreground hover:underline">
                タスクへ戻る
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div data-testid="result-saved-at">savedAt: {savedAtText}</div>
            <button
              type="button"
              className="rounded border bg-background px-3 py-1 hover:bg-accent"
              onClick={clear}
              data-testid="result-clear"
            >
              クリア
            </button>
          </div>

          <ResultPanel
            status={panel.status}
            outputText={panel.outputText}
            expectedText={panel.expectedText}
            hint={panel.hint}
            onRetry={() => {
              if (taskId) {
                router.push(`/tasks/${taskId}`);
                return;
              }
              router.push("/tasks");
            }}
            onBackToTasks={() => router.push("/tasks")}
          />
        </div>
      )}
    </main>
  );
}
