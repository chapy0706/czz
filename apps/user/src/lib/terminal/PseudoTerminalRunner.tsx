// apps/user/src/lib/terminal/PseudoTerminalRunner.tsx
"use client";

import * as React from "react";

import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import type { EvaluateResponse } from "@/lib/terminal/evaluateContract";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import {
  formatNumberSeries,
  formatOutputHuman,
} from "@/lib/utils/formatOutput";

type Props = {
  taskId: string;
  userId?: string;

  /**
   * 互換のため残している（旧: 実行後に /result へ遷移）
   * Playground では常に遷移しない。
   */
  navigateOnRun?: boolean;
};

type PresetKey =
  | "ascending"
  | "descending"
  | "random"
  | "duplicates"
  | "negatives"
  | "almostSorted"
  | "single"
  | "empty";

type PlaygroundState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; outputText: string; meta?: string }
  | { status: "error"; message: string; meta?: string };

type EvaluateErr = Extract<EvaluateResponse, { ok: false }>;

function isEvaluateErr(res: EvaluateResponse): res is EvaluateErr {
  // TSの判定が環境によって弱くなることがあるので、型ガードで確実に絞る
  return res.ok === false;
}

function clampInt(x: number, min: number, max: number): number {
  const n = Number.isFinite(x) ? Math.trunc(x) : min;
  return Math.min(max, Math.max(min, n));
}

function randInt(min: number, max: number): number {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function generatePreset(
  preset: PresetKey,
  len: number,
  min: number,
  max: number,
): number[] {
  const L = clampInt(len, 0, 50);
  const mn = clampInt(min, -999, 999);
  const mx = clampInt(max, -999, 999);

  if (preset === "empty") return [];
  if (preset === "single") return [randInt(mn, mx)];

  const base = Array.from({ length: L }, () => randInt(mn, mx));

  switch (preset) {
    case "ascending":
      return base.slice().sort((a, b) => a - b);

    case "descending":
      return base.slice().sort((a, b) => b - a);

    case "duplicates": {
      const tightMin = clampInt(mn, -9, 9);
      const tightMax = clampInt(mx, -9, 9);
      return Array.from({ length: L }, () => randInt(tightMin, tightMax));
    }

    case "negatives": {
      const negMin = Math.min(mn, -1);
      const negMax = Math.max(mx, 9);
      return Array.from({ length: L }, () => randInt(negMin, negMax));
    }

    case "almostSorted": {
      const sorted = base.slice().sort((a, b) => a - b);
      if (sorted.length < 4) return sorted;
      const i = randInt(0, sorted.length - 2);
      const j = randInt(i + 1, sorted.length - 1);
      const a = sorted.slice();
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    }

    case "random":
    default:
      return base;
  }
}

function describeCommandsForBeginner(submittedProgram: unknown): string[] {
  const commands: any[] = Array.isArray(submittedProgram)
    ? (submittedProgram as any[])
    : typeof submittedProgram === "object" &&
        submittedProgram &&
        Array.isArray((submittedProgram as any).commands)
      ? (submittedProgram as any).commands
      : [];

  const lines: string[] = [];

  for (const c of commands) {
    const type = typeof c?.type === "string" ? c.type : "";
    if (!type) continue;

    const n =
      typeof c?.n === "number"
        ? c.n
        : typeof c?.value === "number"
          ? c.value
          : typeof c?.amount === "number"
            ? c.amount
            : undefined;

    if (type === "MAP_ADD" && typeof n === "number") {
      lines.push(`各要素に +${n} する`);
      continue;
    }
    if (type === "MAP_SUB" && typeof n === "number") {
      lines.push(`各要素から -${n} する`);
      continue;
    }
    if (type === "MAP_MUL" && typeof n === "number") {
      lines.push(`各要素を ×${n} する`);
      continue;
    }
    if (
      (type === "FILTER_GT" || type === "FILTER_GREATER_THAN") &&
      typeof n === "number"
    ) {
      lines.push(`${n} より大きいものだけ残す`);
      continue;
    }
    if (
      (type === "FILTER_LT" || type === "FILTER_LESS_THAN") &&
      typeof n === "number"
    ) {
      lines.push(`${n} より小さいものだけ残す`);
      continue;
    }
    if (type === "FILTER_EQ" && typeof n === "number") {
      lines.push(`${n} と等しいものだけ残す`);
      continue;
    }
    if (type === "SORT_ASC") {
      lines.push("小さい順に並べる");
      continue;
    }
    if (type === "SORT_DESC") {
      lines.push("大きい順に並べる");
      continue;
    }

    lines.push(`コマンド: ${type}`);
  }

  return lines;
}

export function PseudoTerminalRunner(props: Props) {
  const { taskId, userId } = props;

  const uiMode = useUiModeStore((s) => s.mode);
  const isBeginner = uiMode === "beginner";

  const serializeProgram = useCommandBuilderStore((s) => s.serializeProgram);
  const commands = useCommandBuilderStore((s) => s.commands);
  const commandCount = commands.length;

  const [preset, setPreset] = React.useState<PresetKey>("ascending");
  const [len, setLen] = React.useState(10);
  const [min, setMin] = React.useState(0);
  const [max, setMax] = React.useState(20);
  const [inputArr, setInputArr] = React.useState<number[]>(() =>
    generatePreset("ascending", 10, 0, 20),
  );

  const [state, setState] = React.useState<PlaygroundState>({ status: "idle" });

  const submittedProgram = React.useMemo(
    () => serializeProgram(),
    [serializeProgram, commands],
  );
  const beginnerHints = React.useMemo(
    () => (isBeginner ? describeCommandsForBeginner(submittedProgram) : []),
    [isBeginner, submittedProgram],
  );

  function regenerate() {
    const next = generatePreset(preset, len, min, max);
    setInputArr(next);
    setState({ status: "idle" });
  }

  async function runDebug() {
    if (!taskId) return;
    if (commandCount === 0) return;

    setState({ status: "running" });

    const safeInput = inputArr
      .slice(0, 50)
      .map((n) => (Number.isFinite(n) ? Math.trunc(n) : 0));

    const submittedProgramNow = serializeProgram();

    const res = await evaluateTask({
      taskId,
      userId,
      submittedProgram: submittedProgramNow,
      debugInput: safeInput,
      dryRun: true,
      purpose: "debug",
    });

    if (isEvaluateErr(res)) {
      const msg =
        res.error.message || (isBeginner ? "失敗しました" : "Debug run failed");
      const meta =
        typeof res.passed === "number" && typeof res.total === "number"
          ? `(${res.passed}/${res.total})`
          : undefined;

      setState({ status: "error", message: msg, meta });
      return;
    }

    const meta = `(${res.passed}/${res.total})`;
    const out = res.output ?? null;
    const outputText = out == null ? "" : formatOutputHuman(out);

    const fallback =
      outputText.trim().length > 0
        ? outputText
        : isBeginner
          ? "出力がありません（またはサーバーが debugInput に未対応です）"
          : "No output (or server does not support debugInput yet).";

    setState({ status: "done", outputText: fallback, meta });
  }

  const title = isBeginner ? "デバッグ（練習）" : "Debug Playground";
  const desc = isBeginner
    ? "入力を選んで、いまのコマンド列で実行する。結果画面へは移動しない。"
    : "Run current commands with a safe input preset. No navigation to /result.";

  return (
    <section
      data-testid="debug-playground"
      className="rounded-lg border bg-background"
    >
      <header className="flex items-start justify-between gap-3 border-b px-3 py-2">
        <div className="space-y-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>

        <button
          type="button"
          className="shrink-0 rounded border px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => void runDebug()}
          disabled={state.status === "running" || commandCount === 0}
          title={commandCount === 0 ? "コマンドを1つ以上置いてから" : "実行"}
          data-testid="debug-run"
        >
          {state.status === "running"
            ? isBeginner
              ? "実行中…"
              : "Running…"
            : isBeginner
              ? "実行"
              : "Run"}
        </button>
      </header>

      <div className="grid gap-3 p-3 md:grid-cols-2">
        <div className="rounded border bg-card p-3">
          <div className="mb-2 text-xs font-semibold">
            {isBeginner ? "入力" : "Input"}
          </div>

          <div className="grid gap-2">
            <label className="grid gap-1 text-xs">
              <span className="text-muted-foreground">
                {isBeginner ? "プリセット" : "Preset"}
              </span>
              <select
                className="rounded border bg-background px-2 py-2 text-sm"
                value={preset}
                onChange={(e) => setPreset(e.target.value as PresetKey)}
              >
                <option value="ascending">
                  {isBeginner ? "昇順" : "Ascending"}
                </option>
                <option value="descending">
                  {isBeginner ? "降順" : "Descending"}
                </option>
                <option value="random">
                  {isBeginner ? "ランダム" : "Random"}
                </option>
                <option value="duplicates">
                  {isBeginner ? "重複多め" : "Duplicates"}
                </option>
                <option value="negatives">
                  {isBeginner ? "負数あり" : "Negatives"}
                </option>
                <option value="almostSorted">
                  {isBeginner ? "ほぼ整列" : "Almost sorted"}
                </option>
                <option value="single">
                  {isBeginner ? "1要素" : "Single"}
                </option>
                <option value="empty">{isBeginner ? "空配列" : "Empty"}</option>
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">
                  {isBeginner ? "長さ" : "Length"}
                </span>
                <input
                  type="number"
                  className="rounded border bg-background px-2 py-2 text-sm"
                  value={len}
                  min={0}
                  max={50}
                  onChange={(e) =>
                    setLen(clampInt(Number(e.target.value), 0, 50))
                  }
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">min</span>
                <input
                  type="number"
                  className="rounded border bg-background px-2 py-2 text-sm"
                  value={min}
                  min={-999}
                  max={999}
                  onChange={(e) =>
                    setMin(clampInt(Number(e.target.value), -999, 999))
                  }
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">max</span>
                <input
                  type="number"
                  className="rounded border bg-background px-2 py-2 text-sm"
                  value={max}
                  min={-999}
                  max={999}
                  onChange={(e) =>
                    setMax(clampInt(Number(e.target.value), -999, 999))
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={() => regenerate()}
              data-testid="debug-generate"
            >
              {isBeginner ? "入力を生成" : "Generate"}
            </button>

            <div className="rounded border bg-background px-3 py-2 font-mono text-sm">
              {inputArr.length === 0
                ? isBeginner
                  ? "(空)"
                  : "(empty)"
                : formatNumberSeries(inputArr)}
            </div>
          </div>
        </div>

        <div className="rounded border bg-card p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold">
              {isBeginner ? "出力" : "Output"}
            </div>
            {"meta" in state && state.meta ? (
              <div className="text-xs text-muted-foreground">{state.meta}</div>
            ) : null}
          </div>

          {state.status === "idle" ? (
            <div className="text-sm text-muted-foreground">
              {isBeginner
                ? "入力を作って、右上の「実行」を押してね。"
                : "Generate an input and press Run."}
            </div>
          ) : state.status === "running" ? (
            <div className="text-sm text-muted-foreground">
              {isBeginner ? "実行中…" : "Running…"}
            </div>
          ) : state.status === "error" ? (
            <div className="space-y-2">
              <div className="text-sm text-destructive">
                {isBeginner ? "失敗：" : "Error: "} {state.message}
              </div>
              <div className="text-xs text-muted-foreground">
                {isBeginner
                  ? "サーバー側が debugInput / dryRun に未対応の場合もあるよ。"
                  : "Server may not support debugInput/dryRun yet."}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isBeginner && beginnerHints.length > 0 ? (
                <div className="rounded border bg-background px-3 py-2 text-sm">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    やっていること（目安）
                  </div>
                  <ul className="list-disc space-y-1 pl-5">
                    {beginnerHints.slice(0, 6).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded border bg-background px-3 py-2 font-mono text-sm whitespace-pre-wrap">
                {state.outputText}
              </div>

              <div className="text-xs text-muted-foreground">
                {isBeginner
                  ? "ここは結果画面へ行かず、確認だけする場所。テストは「実行」ボタンで倒そう。"
                  : "This is a local check. Use the main Run to clear test cases."}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t px-3 py-2 text-xs text-muted-foreground">
        {isBeginner ? (
          <>コマンドが0個だと実行できないよ。まずは1つ置いてみてね。</>
        ) : (
          <>Need at least one command to run.</>
        )}
      </footer>
    </section>
  );
}
