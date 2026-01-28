// apps/user/src/lib/terminal/PseudoTerminalRunner.tsx
"use client";

import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { ResultPanel } from "@/lib/terminal/ResultPanel";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { safeStringify } from "@/lib/utils/safeStringify";
import { useRouter } from "next/navigation";
import * as React from "react";

type TerminalEntry = {
  id: string;
  kind: "prompt" | "stdout" | "stderr" | "meta";
  text: string;
  ts: number;
};

type UiResultStatus = "success" | "failure";
type UiResult = {
  status: UiResultStatus;
  outputText: string;
  expectedText?: string;
  hint?: { title?: string; detail: string };
};

type PresetKey =
  | "ascending"
  | "descending"
  | "random_0_9"
  | "random_neg_9_9"
  | "duplicates_0_4"
  | "almost_sorted"
  | "edges";

type Props = {
  taskId: string;
  userId?: string;

  /**
   * true の場合、Run 後に /result へ遷移する（従来互換）
   * Playground用途では false 推奨（課題画面内で完結）
   */
  navigateOnRun?: boolean;

  /**
   * submittedProgram の取得元を差し替えたい場合に使用
   * 省略時は CommandBuilderStore の serializeProgram() を使う
   */
  getSubmittedProgram?: () => unknown;
};

function uid(): string {
  return Math.random().toString(36).slice(2);
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    // LCG (Numerical Recipes)
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function generateNumbers(
  preset: PresetKey,
  length: number,
  seed: number,
): number[] {
  const len = clampInt(length, 0, 50);
  const rnd = lcg(seed);

  if (len === 0) return [];

  switch (preset) {
    case "ascending":
      return Array.from({ length: len }, (_, i) => i + 1);

    case "descending":
      return Array.from({ length: len }, (_, i) => len - i);

    case "random_0_9":
      return Array.from({ length: len }, () => Math.floor(rnd() * 10));

    case "random_neg_9_9":
      return Array.from({ length: len }, () => Math.floor(rnd() * 19) - 9);

    case "duplicates_0_4":
      return Array.from({ length: len }, () => Math.floor(rnd() * 5));

    case "almost_sorted": {
      const a = Array.from({ length: len }, (_, i) => i + 1);
      // 2〜3回だけ入れ替える（崩しすぎない）
      const swaps = Math.min(3, Math.max(1, Math.floor(len / 8)));
      for (let k = 0; k < swaps; k++) {
        const i = Math.floor(rnd() * len);
        const j = Math.floor(rnd() * len);
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    }

    case "edges": {
      // “端っこ”多め：0, 1, -1, 9, -9 など
      const pool = [0, 1, -1, 9, -9, 2, -2, 5, -5];
      return Array.from(
        { length: len },
        () => pool[Math.floor(rnd() * pool.length)] ?? 0,
      );
    }

    default:
      return Array.from({ length: len }, () => Math.floor(rnd() * 10));
  }
}

function isNumberArray(x: unknown): x is number[] {
  return (
    Array.isArray(x) &&
    x.every((v) => typeof v === "number" && Number.isFinite(v))
  );
}

function sumNumbers(a: number[]): number {
  let s = 0;
  for (const n of a) s += n;
  return s;
}

function formatNumberList(a: number[]): string {
  // 長い配列でも読みやすく（10個ずつ改行）
  const cols = 10;
  const parts: string[] = [];
  for (let i = 0; i < a.length; i += cols) {
    parts.push(a.slice(i, i + cols).join(", "));
  }
  return parts.join("\n");
}

function formatOutputHuman(output: unknown): string {
  if (isNumberArray(output)) return formatNumberList(output);
  if (typeof output === "string") return output;
  if (typeof output === "number" && Number.isFinite(output))
    return String(output);
  if (output == null) return "";
  return safeStringify(output, 2);
}

function describePreset(preset: PresetKey, locale: "ja" | "en"): string {
  const ja: Record<PresetKey, string> = {
    ascending: "昇順（1,2,3...）",
    descending: "降順（...3,2,1）",
    random_0_9: "ランダム（0〜9）",
    random_neg_9_9: "ランダム（-9〜9）",
    duplicates_0_4: "重複多め（0〜4）",
    almost_sorted: "ほぼ昇順（少しだけ崩す）",
    edges: "端っこ多め（0/±1/±9 など）",
  };

  const en: Record<PresetKey, string> = {
    ascending: "Ascending (1,2,3...)",
    descending: "Descending (...3,2,1)",
    random_0_9: "Random (0..9)",
    random_neg_9_9: "Random (-9..9)",
    duplicates_0_4: "Many duplicates (0..4)",
    almost_sorted: "Almost sorted (few swaps)",
    edges: "Edge values (0/±1/±9...)",
  };

  return (locale === "ja" ? ja : en)[preset];
}

function guessCommandCount(program: unknown): number | null {
  if (!program || typeof program !== "object") return null;
  const obj = program as Record<string, unknown>;
  const cmds = obj["commands"];
  if (!Array.isArray(cmds)) return null;
  return cmds.length;
}

export function PseudoTerminalRunner(props: Props) {
  const { taskId, userId, navigateOnRun = false, getSubmittedProgram } = props;
  const router = useRouter();

  const uiMode = useUiModeStore((s) => s.mode);
  const locale: "ja" | "en" = uiMode === "beginner" ? "ja" : "en";

  const initForTask = useCommandBuilderStore((s) => s.initForTask) as
    | ((taskId: string) => void)
    | undefined;
  const serializeProgram = useCommandBuilderStore((s) => s.serializeProgram) as
    | (() => unknown)
    | undefined;
  const commandsLen = useCommandBuilderStore((s) =>
    Array.isArray(s.commands) ? s.commands.length : 0,
  ) as number;

  React.useEffect(() => {
    // idempotent を期待（なければ無視）
    try {
      initForTask?.(taskId);
    } catch {
      // ignore
    }
  }, [taskId, initForTask]);

  const [entries, setEntries] = React.useState<TerminalEntry[]>([]);
  const [running, setRunning] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<UiResult | null>(null);

  const [preset, setPreset] = React.useState<PresetKey>("ascending");
  const [length, setLength] = React.useState<number>(8);
  const [seed, setSeed] = React.useState<number>(1);

  const debugInput = React.useMemo(
    () => generateNumbers(preset, length, seed),
    [preset, length, seed],
  );

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries, lastResult]);

  function append(kind: TerminalEntry["kind"], text: string) {
    setEntries((prev) => [...prev, { id: uid(), kind, text, ts: Date.now() }]);
  }

  function clear() {
    setEntries([]);
    setLastResult(null);
  }

  // 以前は commands が0の時にボタンを disabled にしていたが、
  // 端末/描画状況によって『ずっと非活性』に見えることがあった。
  // 押せる状態にして、実行時に理由を返す方がUXが良い。
  const canRun = !running;

  async function runOnce() {
    if (!canRun) return;

    // コマンドが無い場合でも、押せて理由が出るようにする
    if (commandsLen <= 0) {
      const msg =
        uiMode === "beginner"
          ? "コマンドがまだない。上でコマンドを追加してから実行してね。"
          : "No commands yet. Add commands first.";
      append("stderr", msg);
      setLastResult({
        status: "failure",
        outputText: msg,
        hint: { title: "NO_COMMANDS", detail: msg },
      });
      return;
    }

    const program = getSubmittedProgram?.() ?? serializeProgram?.();
    const cmdCount = guessCommandCount(program) ?? commandsLen;

    if (!program || cmdCount <= 0) {
      const msg =
        uiMode === "beginner"
          ? "submittedProgram が作れなかったみたい。画面をリロードしてもう一度試してね。"
          : "Failed to build submittedProgram. Try reloading the page.";
      append("stderr", msg);
      setLastResult({
        status: "failure",
        outputText: msg,
        hint: { title: "PROGRAM", detail: msg },
      });
      return;
    }

    append(
      "prompt",
      `> preset=${preset} len=${debugInput.length} seed=${seed} (commands=${cmdCount})`,
    );
    append("stdout", `input:\n${formatNumberList(debugInput)}`);

    setRunning(true);
    try {
      const result = await evaluateTask({
        taskId,
        userId,
        submittedProgram: program,

        // Playground 用
        debugInput,
        dryRun: true,
        purpose: "debug",
      } as any);

      if (result?.ok === true) {
        const output = (result as any)?.output;
        const outText = formatOutputHuman(output);

        if (uiMode === "beginner") {
          const inSum = sumNumbers(debugInput);
          const outNums = isNumberArray(output) ? output : null;
          const outSum = outNums ? sumNumbers(outNums) : null;

          const lines: string[] = [];
          lines.push("入力");
          lines.push(`${formatNumberList(debugInput)}`);
          lines.push(`(個数=${debugInput.length}, 合計=${inSum})`);
          lines.push("");
          lines.push("出力");
          lines.push(outText || "(出力なし)");
          if (outNums)
            lines.push(`(個数=${outNums.length}, 合計=${outSum ?? 0})`);

          setLastResult({
            status: "success",
            outputText: lines.join("\n"),
            hint: {
              title: "観察",
              detail: "入力と出力がどう変わるか見比べてみよう。",
            },
          });
        } else {
          const lines: string[] = [];
          lines.push("Input:");
          lines.push(formatNumberList(debugInput));
          lines.push("");
          lines.push("Output:");
          lines.push(outText || "(no output)");
          setLastResult({ status: "success", outputText: lines.join("\n") });
        }

        append("meta", "exit 0");
      } else {
        const err = (result as any)?.error;
        const kind = err?.kind ? String(err.kind) : "UNKNOWN";
        const msg = err?.message ? String(err.message) : "evaluation failed";
        const details = err?.details ? safeStringify(err.details, 2) : "";

        const detailText =
          uiMode === "beginner"
            ? "サーバー側がプレイグラウンドにまだ対応していない可能性がある。"
            : "Server may not support debugInput/dryRun yet.";

        setLastResult({
          status: "failure",
          outputText: `Error: ${msg}${details ? `\n\n${details}` : ""}`,
          hint: { title: kind, detail: detailText },
        });

        append("stderr", `ERR: ${kind} ${msg}`);
        append("meta", "exit 1");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLastResult({
        status: "failure",
        outputText: `Error: ${message}`,
        hint: {
          title: "NETWORK",
          detail:
            uiMode === "beginner" ? "通信に失敗したよ。" : "Network error.",
        },
      });
      append("stderr", `ERR: ${message}`);
      append("meta", "exit 1");
    } finally {
      setRunning(false);
      if (navigateOnRun) router.push("/result");
    }
  }

  const lengthOptions = [0, 1, 3, 5, 8, 10, 15, 20, 30, 50];
  const seedOptions = [1, 2, 3, 4, 5];

  return (
    <section
      data-testid="pseudo-terminal"
      className="flex h-full flex-col rounded-lg border bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="font-mono text-sm">
          {uiMode === "beginner" ? "プレイグラウンド" : "Playground"}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => void runOnce()}
            disabled={!canRun}
            data-testid="terminal-run"
            title={uiMode === "beginner" ? "実行" : "Run"}
          >
            {running
              ? uiMode === "beginner"
                ? "実行中..."
                : "Running..."
              : uiMode === "beginner"
                ? "実行"
                : "Run"}
          </button>

          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => clear()}
            disabled={running}
            title={uiMode === "beginner" ? "消す" : "Clear"}
          >
            {uiMode === "beginner" ? "消す" : "Clear"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-sm leading-6">
        {entries.map((x) => (
          <div
            key={x.id}
            className={
              x.kind === "stderr"
                ? "text-destructive"
                : x.kind === "meta"
                  ? "text-muted-foreground"
                  : ""
            }
          >
            {x.text}
          </div>
        ))}
        <div ref={bottomRef} />

        {lastResult ? (
          <div className="mt-3">
            <ResultPanel
              status={lastResult.status}
              outputText={lastResult.outputText}
              expectedText={lastResult.expectedText}
              hint={lastResult.hint}
              onRetry={running ? undefined : () => void runOnce()}
            />
          </div>
        ) : (
          <div className="mt-2 rounded border bg-muted/20 p-3 text-xs text-muted-foreground">
            {uiMode === "beginner"
              ? "下のプルダウンで入力を選んで、実行してみよう。"
              : "Choose a safe input preset below and run."}
          </div>
        )}
      </div>

      <div className="border-t px-3 py-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {uiMode === "beginner" ? "入力パターン" : "Preset"}
            <select
              className="h-9 rounded border bg-background px-2 text-sm"
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetKey)}
              disabled={running}
              data-testid="playground-preset"
            >
              {(
                [
                  "ascending",
                  "descending",
                  "random_0_9",
                  "random_neg_9_9",
                  "duplicates_0_4",
                  "almost_sorted",
                  "edges",
                ] as PresetKey[]
              ).map((k) => (
                <option key={k} value={k}>
                  {describePreset(k, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {uiMode === "beginner" ? "長さ" : "Length"}
            <select
              className="h-9 rounded border bg-background px-2 text-sm"
              value={String(length)}
              onChange={(e) => setLength(Number(e.target.value))}
              disabled={running}
              data-testid="playground-length"
            >
              {lengthOptions.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {uiMode === "beginner" ? "バリエーション" : "Seed"}
            <select
              className="h-9 rounded border bg-background px-2 text-sm"
              value={String(seed)}
              onChange={(e) => setSeed(Number(e.target.value))}
              disabled={running}
              data-testid="playground-seed"
            >
              {seedOptions.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="h-9 rounded border px-3 text-sm disabled:opacity-50"
            onClick={() => setSeed((s) => (s >= 5 ? 1 : s + 1))}
            disabled={running}
            data-testid="playground-next-seed"
          >
            {uiMode === "beginner" ? "別の例" : "Next"}
          </button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {uiMode === "beginner" ? "プレビュー：" : "Preview: "}
          <span className="font-mono">
            {debugInput.length === 0
              ? "(empty)"
              : debugInput.slice(0, 24).join(", ")}
            {debugInput.length > 24 ? " ..." : ""}
          </span>
        </div>

        <div className="mt-2 text-xs text-muted-foreground font-mono">
          commands={commandsLen}
        </div>

        {commandsLen <= 0 ? (
          <div className="mt-2 text-xs text-destructive">
            {uiMode === "beginner"
              ? "コマンドがまだない。上でコマンドを追加してから実行してね。"
              : "No commands yet. Add commands first."}
          </div>
        ) : null}
      </div>
    </section>
  );
}
