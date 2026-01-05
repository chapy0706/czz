// apps/user/src/lib/terminal/useRunToResultButton.ts
"use client";

import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { useRouter } from "next/navigation";
import * as React from "react";

export const LAST_RESULT_STORAGE_KEY = "czz-terminal-last-result";

type RunPhase = "idle" | "running" | "ready";

function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(x, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    return "";
  }
}

function persistLastResult(taskId: string, response: unknown): boolean {
  if (typeof window === "undefined") return false;

  const payload = { savedAt: Date.now(), meta: { taskId }, response };
  const json = safeStringify(payload);
  if (!json) return false;

  try {
    localStorage.setItem(LAST_RESULT_STORAGE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export type UseRunToResultButtonOptions = {
  taskId: string | null;

  /**
   * 実行対象が変わったらボタンを idle に戻すためのキー。
   * 例: JSON.stringify(commands.map(c => c.value))
   */
  resetKey: string;

  /**
   * submittedProgram を返す関数（useCommandBuilderStore.getState().serializeProgram() 等）
   */
  getSubmittedProgram: () => unknown;

  userId?: string;

  /**
   * 既定: "/result"
   */
  navigateTo?: string;

  /**
   * true の場合、実行（判定→保存）完了後に自動で navigateTo へ遷移する。
   * 既定: true（A案）
   */
  autoNavigateOnComplete?: boolean;
};

export type UseRunToResultButtonReturn = {
  phase: RunPhase;
  label: string;
  disabled: boolean;
  title: string;
  canOpenResult: boolean;
  onClick: () => void;
  reset: () => void;
};

export function useRunToResultButton(opts: UseRunToResultButtonOptions): UseRunToResultButtonReturn {
  const router = useRouter();

  const navigateTo = opts.navigateTo ?? "/result";
  const autoNavigateOnComplete = opts.autoNavigateOnComplete ?? true;

  const [phase, setPhase] = React.useState<RunPhase>("idle");
  const [canOpenResult, setCanOpenResult] = React.useState(false);

  React.useEffect(() => {
    setPhase("idle");
    setCanOpenResult(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.resetKey, opts.taskId]);

  const reset = React.useCallback(() => {
    setPhase("idle");
    setCanOpenResult(false);
  }, []);

  const onClick = React.useCallback(() => {
    // ready なら「結果へ進む」
    if (phase === "ready") {
      router.push(navigateTo);
      return;
    }

    if (phase === "running") return;
    if (!opts.taskId) return;

    setPhase("running");

    (async () => {
      try {
        const submittedProgram = opts.getSubmittedProgram();
        const res: unknown = await evaluateTask({
          taskId: opts.taskId!,
          userId: opts.userId,
          submittedProgram,
        });

        const saved = persistLastResult(opts.taskId!, res);
        setCanOpenResult(saved);
        setPhase("ready");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Network error";
        const errRes = { ok: false, error: { kind: "NETWORK", message, details: e } };

        const saved = persistLastResult(opts.taskId!, errRes);
        setCanOpenResult(saved);
        setPhase("ready");
      } finally {
        // A案：判定完了後に自動遷移
        if (autoNavigateOnComplete) {
          router.push(navigateTo);
        }
      }
    })().catch(() => {
      setPhase("ready");
      if (autoNavigateOnComplete) router.push(navigateTo);
    });
  }, [phase, router, navigateTo, autoNavigateOnComplete, opts]);

  const label = phase === "running" ? "判定中…" : phase === "ready" ? "結果へ進む" : "実行";

  // A案では「保存失敗でも結果画面に行く」可能性を残すため、disabled には含めない
  const disabled = phase === "running" || !opts.taskId;

  const title =
    !opts.taskId
      ? "taskId が無いので実行できない"
      : phase === "ready" && !canOpenResult
        ? "結果の保存に失敗した（/result は空になる可能性がある）"
        : phase === "ready"
          ? "結果画面へ"
          : "実行";

  return { phase, label, disabled, title, canOpenResult, onClick, reset };
}
