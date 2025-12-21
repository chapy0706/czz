// apps/user/components/terminal/PseudoTerminalRunner.tsx
"use client";

import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { useTerminalHistoryStore } from "@/lib/terminal/terminalStore";
import * as React from "react";

type TerminalEntry = {
  id: string;
  kind: "prompt" | "stdout" | "stderr" | "meta";
  text: string;
  ts: number;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function summarizeZod(message: string): string {
  // 最初は雑でも良い。後で “よくあるエラー” に寄せて育てる。
  if (message.includes("Expected array") && message.includes("received object")) {
    return "ZOD: Expected array, received object (input must be an array)";
  }
  if (message.toLowerCase().includes("enum")) {
    return "ZOD: Invalid command type (typo or doc mismatch)";
  }
  return `ZOD: ${message}`;
}

export function PseudoTerminalRunner(props: { taskId: string; userId: string }) {
  const { taskId, userId } = props;

  const history = useTerminalHistoryStore((s) => s.history);
  const pushHistory = useTerminalHistoryStore((s) => s.pushHistory);

  const [entries, setEntries] = React.useState<TerminalEntry[]>([]);
  const [input, setInput] = React.useState("");
  const [running, setRunning] = React.useState(false);

  const [historyIndex, setHistoryIndex] = React.useState<number | null>(null);
  const draftRef = React.useRef<string>("");

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  const prompt = "czz$ ";

  function append(kind: TerminalEntry["kind"], text: string) {
    setEntries((prev) => [...prev, { id: uid(), kind, text, ts: Date.now() }]);
  }

  function clear() {
    setEntries([]);
  }

  async function execute(raw: string) {
    const cmd = raw.trim();
    if (!cmd || running) return;

    if (!userId) {
      append("stderr", "ERR: userId is required (guest id is OK).");
      append("meta", "exit 1");
      return;
    }

    pushHistory(cmd);
    setHistoryIndex(null);

    append("prompt", `${prompt}${cmd}`);

    // built-in commands
    if (cmd === ":clear") {
      clear();
      return;
    }

    // JSON parse (submittedProgram)
    let submittedProgram: unknown;
    try {
      submittedProgram = JSON.parse(cmd);
    } catch {
      append(
        "stderr",
        'ERR: input must be JSON (submittedProgram). Example: [{"type":"FILTER_GT",...}]'
      );
      append("meta", "exit 1");
      return;
    }

    setRunning(true);
    try {
      const result = await evaluateTask({ taskId, userId, submittedProgram });

      if ("error" in result) {
        append("stdout", `FAIL (${result.passed ?? "?"}/${result.total ?? "?"})`);
        append(
          "stderr",
          result.error.kind === "ZOD"
            ? summarizeZod(result.error.message)
            : `ERR: ${result.error.message}`
        );
        append("meta", "exit 1");
      } else {
        append("stdout", `PASS (${result.passed}/${result.total})`);
        append("meta", "exit 0");
      }
    } finally {
      setRunning(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+L -> clear
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      clear();
      return;
    }

    // history navigation (single-line feel)
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

    // Enter to run (Shift+Enter => newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void execute(input);
      setInput("");
    }
  }

  return (
    <section className="flex h-full flex-col rounded-lg border bg-background">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="font-mono text-sm">Pseudo Terminal</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
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
      </div>

      <div className="border-t px-3 py-2">
        <textarea
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
