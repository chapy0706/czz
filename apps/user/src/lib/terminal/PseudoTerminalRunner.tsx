// apps/user/src/lib/terminal/PseudoTerminalRunner.tsx
"use client";

import * as React from "react";

import { formatNumberList } from "@/lib/terminal/formatOutput";
import { runPlayground } from "@/lib/terminal/playgroundClient";

type Props = {
  /**
   * CommandBuilder の serializeProgram() を渡す想定
   * 例: { commands: [...] }
   */
  submittedProgram: unknown;

  /**
   * 見た目上の無効化（タスク未ロードなど）
   */
  disabled?: boolean;
};

type PresetId =
  | "random5"
  | "random8"
  | "ascending5"
  | "descending5"
  | "duplicates7"
  | "smallMix";

function makePreset(id: PresetId): number[] {
  switch (id) {
    case "random5":
      return makeRandomIntList(5, 0, 9);
    case "random8":
      return makeRandomIntList(8, 0, 20);
    case "ascending5":
      return [0, 2, 3, 5, 7];
    case "descending5":
      return [9, 7, 5, 3, 1];
    case "duplicates7":
      return [2, 2, 3, 5, 5, 7, 0];
    case "smallMix":
    default:
      return [2, 3, 5, 7, 0];
  }
}

function makeRandomIntList(len: number, min: number, max: number): number[] {
  const out: number[] = [];
  const n = Math.max(0, Math.min(50, Math.trunc(len)));
  const lo = Math.trunc(min);
  const hi = Math.max(lo, Math.trunc(max));
  for (let i = 0; i < n; i++) {
    const v = lo + Math.floor(Math.random() * (hi - lo + 1));
    out.push(v);
  }
  return out;
}

export function PseudoTerminalRunner(props: Props) {
  const { submittedProgram, disabled } = props;

  const [preset, setPreset] = React.useState<PresetId>("smallMix");
  const [input, setInput] = React.useState<number[]>(() =>
    makePreset("smallMix"),
  );

  const [running, setRunning] = React.useState(false);
  const [output, setOutput] = React.useState<number[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function applyPreset(next: PresetId) {
    setPreset(next);
    setInput(makePreset(next));
    setOutput(null);
    setError(null);
  }

  function reroll() {
    // “ランダム” 系だけ再生成
    if (preset === "random5") setInput(makePreset("random5"));
    else if (preset === "random8") setInput(makePreset("random8"));
    else setInput(makeRandomIntList(input.length || 5, 0, 9));
    setOutput(null);
    setError(null);
  }

  async function run() {
    if (running) return;
    if (disabled) return;

    setRunning(true);
    setError(null);

    const res = await runPlayground({
      debugInput: input,
      submittedProgram,
    });

    if (!res.ok) {
      setOutput(null);
      setError(res.error.message);
      setRunning(false);
      return;
    }

    setOutput(res.output);
    setRunning(false);
  }

  return (
    <section
      className="space-y-3"
      data-testid="playground-panel"
      aria-label="playground panel"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Playground</div>
          <div className="mt-1 text-xs text-muted-foreground">
            入力セットを選んで、いま組んだコマンド列の “出力だけ” を確認する。
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
            onClick={run}
            disabled={disabled || running}
            data-testid="playground-run"
          >
            {running ? "実行中…" : "実行"}
          </button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-1">
          <label className="text-xs font-semibold" htmlFor="playground-preset">
            入力セット
          </label>
          <select
            id="playground-preset"
            className="w-full rounded border bg-background px-3 py-2 text-sm"
            value={preset}
            onChange={(e) => applyPreset(e.target.value as PresetId)}
            disabled={disabled}
          >
            <option value="smallMix">2, 3, 5, 7, 0（混在）</option>
            <option value="ascending5">0, 2, 3, 5, 7（昇順済み）</option>
            <option value="descending5">9, 7, 5, 3, 1（降順）</option>
            <option value="duplicates7">2, 2, 3, 5, 5, 7, 0（重複あり）</option>
            <option value="random5">ランダム 5 個（0..9）</option>
            <option value="random8">ランダム 8 個（0..20）</option>
          </select>
        </div>

        <button
          type="button"
          className="rounded border px-3 py-2 text-xs hover:bg-accent disabled:opacity-50"
          onClick={reroll}
          disabled={disabled}
          data-testid="playground-reroll"
        >
          もう一回（ランダム）
        </button>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="text-xs font-semibold">Input</div>
        <div className="mt-1 font-mono text-sm" data-testid="playground-input">
          {formatNumberList(input)}
        </div>

        <div className="mt-3 text-xs font-semibold">Output</div>
        <div className="mt-1 font-mono text-sm" data-testid="playground-output">
          {output ? formatNumberList(output) : "(not run yet)"}
        </div>

        {error ? (
          <div
            className="mt-3 rounded border bg-muted/30 p-2 text-xs text-muted-foreground"
            data-testid="playground-error"
          >
            Error: {error}
          </div>
        ) : null}
      </div>

      <footer className="text-xs text-muted-foreground">
        ※ 判定（正解/不正解）はここでは出さない。出力の変化だけを見る場所。
      </footer>
    </section>
  );
}
