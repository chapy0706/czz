// apps/user/src/lib/command-builder/CommandBuilder.tsx
"use client";

import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { ResultPanel } from "@/lib/terminal/ResultPanel";
import { useRouter } from "next/navigation";
import * as React from "react";

import { CommandEditorSheet } from "./CommandEditorSheet";
import { CommandList } from "./CommandList";
import { CommandPalette } from "./CommandPalette";
import { PipelinePanel } from "./PipelinePanel";

const LAST_RESULT_STORAGE_KEY = "czz-terminal-last-result";

type UiResultStatus = "success" | "failure";
type UiResult = {
  status: UiResultStatus;
  outputText: string;
  hint?: { title?: string; detail: string };
};

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function safeJsonCompact(value: unknown): string {
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    return "";
  }
}

function persistLastResult(taskId: string, response: unknown): boolean {
  if (typeof window === "undefined") return false;

  const payload = { savedAt: Date.now(), meta: { taskId }, response };
  const json = safeJsonCompact(payload);
  if (!json) return false;

  try {
    localStorage.setItem(LAST_RESULT_STORAGE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

function toUiResult(res: any): UiResult {
  const total = typeof res?.total === "number" ? res.total : undefined;
  const passed = typeof res?.passed === "number" ? res.passed : undefined;

  const hasError = res && typeof res === "object" && "error" in res;
  const failedByScore = typeof total === "number" && typeof passed === "number" && passed < total;

  if (hasError || failedByScore) {
    const score =
      typeof passed === "number" && typeof total === "number" ? `FAIL (${passed}/${total})` : "FAIL";

    const errObj = res?.error;
    const errText = errObj?.message
      ? `ERR: ${String(errObj.message)}`
      : hasError
        ? "ERR: evaluation failed"
        : "ERR: not passed";

    const output = res?.output ?? res?.stdout ?? res?.runOutput ?? res?.data?.output ?? undefined;
    const outBlock = output ? `\n\n--- output ---\n${safeStringify(output)}` : "";

    return {
      status: "failure",
      outputText: `${score}\n${errText}${outBlock}`,
      hint: { title: errObj?.kind === "ZOD" ? "Validation" : "Error", detail: errText },
    };
  }

  const score =
    typeof passed === "number" && typeof total === "number" ? `PASS (${passed}/${total})` : "PASS";

  const output = res?.output ?? res?.stdout ?? res?.runOutput ?? res?.data?.output ?? undefined;
  const outBlock = output ? `\n\n--- output ---\n${safeStringify(output)}` : "";

  return { status: "success", outputText: `${score}${outBlock}` };
}

export function CommandBuilder(props: { taskId: string }) {
  const { taskId } = props;

  const router = useRouter();

  const commands = useCommandBuilderStore((s) => s.commands);
  const selectedId = useCommandBuilderStore((s) => s.selectedId);
  const editingId = useCommandBuilderStore((s) => s.editingId);

  const initForTask = useCommandBuilderStore((s) => s.initForTask);
  const select = useCommandBuilderStore((s) => s.select);
  const openEditor = useCommandBuilderStore((s) => s.openEditor);
  const closeEditor = useCommandBuilderStore((s) => s.closeEditor);

  const add = useCommandBuilderStore((s) => s.add);
  const remove = useCommandBuilderStore((s) => s.remove);
  const move = useCommandBuilderStore((s) => s.move);
  const clear = useCommandBuilderStore((s) => s.clear);
  const serializeProgram = useCommandBuilderStore((s) => s.serializeProgram);
  const updateCommandJson = useCommandBuilderStore((s) => s.updateCommandJson);

  const editing = React.useMemo(() => {
    return editingId ? commands.find((c) => c.id === editingId) ?? null : null;
  }, [commands, editingId]);

  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<unknown>(null);

  React.useEffect(() => {
    initForTask(taskId);
  }, [taskId, initForTask]);

  const program = React.useMemo(() => serializeProgram(), [commands, serializeProgram]);
  const resetKey = React.useMemo(() => JSON.stringify(commands.map((c) => c.value)), [commands]);

  // PipelinePanel state
  const selectedIndex = React.useMemo(() => {
    if (!selectedId) return -1;
    return commands.findIndex((c) => c.id === selectedId);
  }, [commands, selectedId]);

  const [revealIndex, setRevealIndex] = React.useState<number>(-1);

  React.useEffect(() => {
    if (selectedIndex < 0) {
      setRevealIndex(-1);
      return;
    }
    setRevealIndex(selectedIndex);
  }, [selectedIndex]);

  const stepPlus = React.useCallback(() => {
    if (selectedIndex < 0) return;
    setRevealIndex((cur) => Math.min(Math.max(cur, selectedIndex) + 1, commands.length - 1));
  }, [selectedIndex, commands.length]);

  const stepMinus = React.useCallback(() => {
    if (selectedIndex < 0) return;
    setRevealIndex((cur) => Math.max(cur - 1, selectedIndex));
  }, [selectedIndex]);

  const selectNext = React.useCallback(() => {
    if (selectedIndex < 0) return;
    const nextIndex = selectedIndex + 1;
    if (nextIndex > revealIndex) return;
    if (nextIndex < 0 || nextIndex >= commands.length) return;
    const next = commands[nextIndex];
    if (!next) return;
    select(next.id);
  }, [commands, revealIndex, select, selectedIndex]);

  const onSelectStep = React.useCallback(
    (index: number) => {
      const cmd = commands[index];
      if (!cmd) return;
      select(cmd.id);
    },
    [commands, select]
  );

  const uiResult = React.useMemo(() => {
    if (!result) return null;
    return toUiResult(result as any);
  }, [result]);

  // A案: 実行 → 判定/保存 → /result へ自動遷移
  async function runA() {
    if (running) return;
    if (commands.length === 0) return;

    setRunning(true);
    setResult(null);

    try {
      const res = await (evaluateTask as any)({ taskId, submittedProgram: program });
      setResult(res);
      persistLastResult(taskId, res);
    } catch (e: any) {
      const errRes = { error: { message: e?.message ?? String(e) } };
      setResult(errRes);
      persistLastResult(taskId, errRes);
    } finally {
      setRunning(false);
      router.push("/result");
    }
  }

  return (
    <section className="space-y-4" data-testid="command-builder" aria-label="pipeline workspace">
      <div className="w-full rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Runner</div>
            <div className="mt-1 text-xs text-muted-foreground">コマンドを並べて実行する。</div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CommandPalette
              onAdd={(type) => add(type)}
              runButton={{
                taskId,
                resetKey,
                getSubmittedProgram: () => serializeProgram(),
                navigateTo: "/result",
                autoNavigateOnComplete: true,
              }}
            />
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm disabled:opacity-50"
              onClick={clear}
              disabled={running}
              data-testid="cb-clear"
            >
              Clear
            </button>

            {/* Run（A案対応）は CommandPalette 横に1つだけ */}
            {/* NOTE: 旧 Run ボタンはノイズなので撤去 */}
          </div>
        </div>

        {/* Commands（横並び）。Selected枠は撤去し、行操作＋Sheetで完結させる */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Commands</div>

          <CommandList
            layout="horizontal"
            commands={commands}
            selectedId={selectedId}
            onSelect={(id) => select(id)}
            onEdit={(id) => openEditor(id)}
            onRemove={(id) => remove(id)}
            onReorder={(from, to) => move(from, to)}
          />

          {/* 選択がないときの空状態（Selectedの代替） */}
          {commands.length > 0 && !selectedId ? (
            <div
              className="mt-2 rounded border bg-muted/20 p-3 text-sm text-muted-foreground"
              data-testid="command-selected-empty"
            >
              まだ何も選択していない。コマンドをクリックして編集する。
            </div>
          ) : null}
        </div>

        {/* 下段：PipelinePanel 全幅。デフォルトは compact（PipelinePanel側で対応） */}
        {selectedId ? (
          <div className="mt-4" data-testid="pipe-panel-wrap">
            <PipelinePanel
              commands={commands}
              selectedId={selectedId}
              selectedIndex={selectedIndex}
              revealIndex={revealIndex}
              onStepPlus={stepPlus}
              onStepMinus={stepMinus}
              onSelectNext={selectNext}
              onSelectStep={onSelectStep}
            />
          </div>
        ) : null}

        {/* Result（この画面はデバッグ用途として残す） */}
        <div className="mt-4" data-testid="cb-result">
          <div className="text-xs font-medium text-muted-foreground">Result</div>

          {uiResult ? (
            <ResultPanel
              status={uiResult.status}
              outputText={uiResult.outputText}
              hint={uiResult.hint}
              onRetry={running ? undefined : runA}
            />
          ) : (
            <div className="mt-2 rounded border bg-muted/20 p-3 text-sm text-muted-foreground">
              まだ実行していない。（Run すると /result に遷移する）
            </div>
          )}

          {result ? (
            <details className="mt-2 rounded border bg-muted/20 p-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">raw result (debug)</summary>
              <pre className="mt-2 max-h-[240px] overflow-auto rounded border bg-background p-3 text-xs">
                {safeStringify(result)}
              </pre>
            </details>
          ) : null}
        </div>
      </div>

      <CommandEditorSheet
        selected={editing}
        onClose={closeEditor}
        onSave={(id, next) => updateCommandJson(id, next)}
      />
    </section>
  );
}
