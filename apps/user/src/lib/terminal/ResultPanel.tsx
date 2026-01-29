// apps/user/src/lib/terminal/ResultPanel.tsx
"use client";

import * as React from "react";

type ResultStatus = "success" | "failure";

type Props = {
  status: ResultStatus;

  /**
   * 実行結果（表示したいテキスト）
   * 例: 評価APIの output / stdout / runner output など
   */
  outputText: string;

  /**
   * 期待値（あれば）
   * 例: expectedOutput / golden / snapshot など
   */
  expectedText?: string;

  /**
   * 差分の手がかり（最初の不一致行など）
   * UIを“説明しすぎない”ため、まずは1点だけで十分
   */
  hint?: {
    title?: string; // 例: "First mismatch"
    detail: string; // 例: "line 3: expected '10' but got '9'"
  };

  /**
   * 次アクション
   * - もう一回: コマンド調整→再実行の導線
   * - タスク一覧: 後で Top/Tasks が整ったら使う
   */
  onRetry?: () => void;
  onBackToTasks?: () => void;

  /**
   * 表示オプション
   */
  maxPreviewLines?: number; // default: 12
};

function takeFirstLines(
  text: string,
  maxLines: number,
): { preview: string; omitted: number } {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const head = lines.slice(0, maxLines);
  const omitted = Math.max(0, lines.length - head.length);
  return { preview: head.join("\n"), omitted };
}

export function ResultPanel(props: Props) {
  const {
    status,
    outputText,
    expectedText,
    hint,
    onRetry,
    onBackToTasks,
    maxPreviewLines = 12,
  } = props;

  const { preview: outPreview, omitted: outOmitted } = React.useMemo(
    () => takeFirstLines(outputText ?? "", maxPreviewLines),
    [outputText, maxPreviewLines],
  );

  const expected = expectedText ?? "";
  const { preview: expPreview, omitted: expOmitted } = React.useMemo(
    () => takeFirstLines(expected, maxPreviewLines),
    [expected, maxPreviewLines],
  );

  const isSuccess = status === "success";

  return (
    <section
      className="mt-4 rounded-lg border bg-card p-4"
      data-testid="result-panel"
      aria-label="result panel"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Result</div>
          <div
            className={[
              "inline-flex items-center gap-2 rounded border px-2 py-1 text-xs",
              isSuccess ? "bg-background" : "bg-background",
            ].join(" ")}
            data-testid="result-status"
          >
            <span
              className={[
                "inline-block h-2 w-2 rounded-full",
                isSuccess ? "bg-emerald-500" : "bg-rose-500",
              ].join(" ")}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              {isSuccess ? "SUCCESS" : "FAILURE"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRetry ? (
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-xs hover:bg-accent"
              onClick={onRetry}
              data-testid="result-retry"
            >
              もう一回
            </button>
          ) : null}
          {onBackToTasks ? (
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-xs hover:bg-accent"
              onClick={onBackToTasks}
              data-testid="result-back-to-tasks"
            >
              タスク一覧へ
            </button>
          ) : null}
        </div>
      </header>

      {/* ヒント（最初の不一致など） */}
      {hint?.detail ? (
        <div
          className="mt-3 rounded border bg-muted/30 p-3"
          data-testid="result-hint"
        >
          <div className="text-xs font-semibold">{hint.title ?? "Hint"}</div>
          <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
            {hint.detail}
          </div>
        </div>
      ) : null}

      {/* Output */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold">Output</div>
          {outOmitted > 0 ? (
            <div className="text-xs text-muted-foreground">
              （先頭 {maxPreviewLines} 行のみ表示 / 省略 {outOmitted} 行）
            </div>
          ) : null}
        </div>
        <pre
          className="mt-2 max-h-[280px] overflow-auto rounded border bg-background p-3 text-xs leading-5"
          data-testid="result-output"
        >
          {outPreview.length > 0 ? outPreview : "(empty)"}
        </pre>
      </div>

      {/* Expected（任意） */}
      {expectedText != null ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">Expected</div>
            {expOmitted > 0 ? (
              <div className="text-xs text-muted-foreground">
                （先頭 {maxPreviewLines} 行のみ表示 / 省略 {expOmitted} 行）
              </div>
            ) : null}
          </div>
          <pre
            className="mt-2 max-h-[280px] overflow-auto rounded border bg-background p-3 text-xs leading-5"
            data-testid="result-expected"
          >
            {expPreview.length > 0 ? expPreview : "(empty)"}
          </pre>
        </div>
      ) : null}

      {/* 最低限の導線メモ（UI完成までの補助） */}
      <footer className="mt-4 text-xs text-muted-foreground">
        次の手: パラメータを調整して再実行し、結果の変化を観察する。
      </footer>
    </section>
  );
}
