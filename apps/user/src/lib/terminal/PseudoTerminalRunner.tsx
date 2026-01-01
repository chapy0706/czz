// apps/user/src/lib/terminal/PseudoTerminalRunner.tsx
"use client";

import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { ResultPanel } from "@/lib/terminal/ResultPanel";
import { useTerminalHistoryStore } from "@/lib/terminal/terminalStore";
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

function uid() {
  return Math.random().toString(36).slice(2);
}

function summarizeZod(message: string): string {
  if (message.includes("Expected array") && message.includes("received object")) {
    return "ZOD: Expected array, received object (input must be an array)";
  }
  if (message.toLowerCase().includes("enum")) {
    return "ZOD: Invalid command type (typo or doc mismatch)";
  }
  return `ZOD: ${message}`;
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function PseudoTerminalRunner(props: { taskId: string; userId?: string }) {
  const { taskId, userId } = props;

  const history = useTerminalHistoryStore((s) => s.history);
  const pushHistory = useTerminalHistoryStore((s) => s.pushHistory);

  const [entries, setEntries] = React.useState<TerminalEntry[]>([]);
  const [input, setInput] = React.useState("");
  const [running, setRunning] = React.useState(false);

  const [historyIndex, setHistoryIndex] = React.useState<number | null>(null);
  const draftRef = React.useRef<string>("");

  const [lastResult, setLastResult] = React.useState<UiResult | null>(null);

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, lastResult]);

  const prompt = "czz$ ";

  function append(kind: TerminalEntry["kind"], text: string) {
    setEntries((prev) => [...prev, { id: uid(), kind, text, ts: Date.now() }]);
  }

  function clear() {
    setEntries([]);
    setLastResult(null);
  }

  async function execute(raw: string) {
    const cmd = raw.trim();
    if (!cmd || running) return;

    pushHistory(cmd);
    setHistoryIndex(null);

    append("prompt", `${prompt}${cmd}`);

    if (cmd === ":clear") {
      clear();
      return;
    }

    let submittedProgram: unknown;
    try {
      submittedProgram = JSON.parse(cmd);
    } catch {
      const msg = 'ERR: input must be JSON (submittedProgram). Example: [{"type":"FILTER_GT",...}]';
      append("stderr", msg);
      append("meta", "exit 1");

      // NOTE:
      // strict mode: pseudo-terminal.spec は getByText(/ERR: .../) を使う。
      // ResultPanel に同じ文言を二重表示すると strict mode violation になるので、
      // parse失敗は「端末ログだけ」に出す。
      return;
    }

    setRunning(true);
    try {
      const result: any = await evaluateTask({ taskId, userId, submittedProgram });

      const total = typeof result?.total === "number" ? result.total : undefined;
      const passed = typeof result?.passed === "number" ? result.passed : undefined;

      const hasError = result && typeof result === "object" && "error" in result;
      const failedByScore = typeof total === "number" && typeof passed === "number" && passed < total;

      if (hasError || failedByScore) {
        const passLine =
          typeof passed === "number" && typeof total === "number" ? `FAIL (${passed}/${total})` : "FAIL";

        const errObj = result?.error;
        const errText =
          errObj?.kind === "ZOD"
            ? summarizeZod(String(errObj?.message ?? ""))
            : errObj?.message
              ? `ERR: ${String(errObj.message)}`
              : "ERR: evaluation failed";

        append("stdout", passLine);
        append("stderr", errText);
        append("meta", "exit 1");

        const maybeOutput =
          result?.output ?? result?.stdout ?? result?.runOutput ?? result?.data?.output ?? undefined;
        const outText = maybeOutput ? `\n\n--- output ---\n${asText(maybeOutput)}` : "";

        setLastResult({
          status: "failure",
          outputText: `${passLine}\n${errText}${outText}`,
          hint: { title: errObj?.kind === "ZOD" ? "Validation" : "Error", detail: errText },
        });
      } else {
        const okLine =
          typeof passed === "number" && typeof total === "number" ? `PASS (${passed}/${total})` : "PASS";

        const maybeOutput =
          result?.output ?? result?.stdout ?? result?.runOutput ?? result?.data?.output ?? undefined;
        const outText = maybeOutput ? `\n\n--- output ---\n${asText(maybeOutput)}` : "";

        append("stdout", okLine);
        if (outText) append("stdout", outText);
        append("meta", "exit 0");

        setLastResult({ status: "success", outputText: `${okLine}${outText}` });
      }
    } finally {
      setRunning(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      clear();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;

      if (historyIndex === null) {
        draftRef.current = input;
        setHistoryIndex(0);
        setInput(history[0] ?? "");
      } else {
        const next = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(next);
        setInput(history[next] ?? "");
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIndex === null) return;

      const next = historyIndex - 1;
      if (next < 0) {
        setHistoryIndex(null);
        setInput(draftRef.current);
      } else {
        setHistoryIndex(next);
        setInput(history[next] ?? "");
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void execute(input);
      setInput("");
    }
  }

  const canRun = !running && input.trim().length > 0;

  return (
    <section data-testid="pseudo-terminal" className="flex h-full flex-col rounded-lg border bg-background">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="font-mono text-sm">Pseudo Terminal</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => {
              void execute(input);
              setInput("");
            }}
            disabled={!canRun}
            data-testid="terminal-run"
            title="Run (Enter)"
          >
            Run
          </button>

          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => clear()}
            disabled={running}
            title="Ctrl+L"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-sm leading-6">
        {entries.map((x) => (
          <div
            key={x.id}
            className={x.kind === "stderr" ? "text-destructive" : x.kind === "meta" ? "text-muted-foreground" : ""}
          >
            {x.text}
          </div>
        ))}
        <div ref={bottomRef} />

        {lastResult ? (
          <ResultPanel
            status={lastResult.status}
            outputText={lastResult.outputText}
            expectedText={lastResult.expectedText}
            hint={lastResult.hint}
            onRetry={
              running
                ? undefined
                : () => {
                    const el = document.querySelector<HTMLTextAreaElement>('[data-testid="terminal-input"]');
                    el?.focus();
                  }
            }
          />
        ) : null}
      </div>

      <div className="border-t px-3 py-2">
        <textarea
          data-testid="terminal-input"
          className="w-full resize-none rounded border bg-background px-2 py-2 font-mono text-sm"
          rows={1}
          placeholder='Paste submittedProgram JSON here. (":clear" to clear)'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={running}
        />
        <div className="mt-1 text-xs text-muted-foreground">
          Enter: run / Shift+Enter: newline / ↑↓: history / Ctrl+L: clear
        </div>
      </div>
    </section>
  );
}
