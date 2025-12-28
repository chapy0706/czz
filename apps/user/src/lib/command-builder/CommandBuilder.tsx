// apps/user/src/components/command-builder/CommandBuilder.tsx
"use client";

import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import * as React from "react";

import { CommandEditorSheet } from "./CommandEditorSheet";
import { CommandList } from "./CommandList";
import { CommandPalette } from "./CommandPalette";
import { PipelinePanel } from "./PipelinePanel";

export function CommandBuilder(props: { taskId: string }) {
  const { taskId } = props;

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

  // PipelinePanel state（前に出した実装のまま）
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
    const nextIndex = revealIndex + 1;
    if (nextIndex < 0 || nextIndex >= commands.length) return;
    const next = commands[nextIndex];
    if (!next) return;
    select(next.id);
  }, [commands, revealIndex, select, selectedIndex]);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await (evaluateTask as any)({ taskId, submittedProgram: program });
      setResult(res);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="space-y-4" data-testid="command-builder">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Command Builder</div>
          <div className="text-xs text-muted-foreground">
            Build <span className="font-mono">{"{ commands: [...] }"}</span> without typing JSON.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommandPalette onAdd={(type) => add(type)} />
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={clear}
            disabled={running}
            data-testid="cb-clear"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Pipeline</div>

          <CommandList
            commands={commands}
            selectedId={selectedId}
            onSelect={(id) => select(id)}
            onEdit={(id) => openEditor(id)}
            onRemove={(id) => remove(id)}
            onReorder={(from, to) => move(from, to)}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm disabled:opacity-50"
              onClick={run}
              disabled={running || commands.length === 0}
              data-testid="cb-run"
            >
              {running ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <PipelinePanel
            commands={commands}
            selectedId={selectedId}
            selectedIndex={selectedIndex}
            revealIndex={revealIndex}
            onStepPlus={stepPlus}
            onStepMinus={stepMinus}
            onSelectNext={selectNext}
          />

          <div>
            <div className="text-xs font-medium text-muted-foreground">Generated JSON</div>
            <pre className="mt-2 max-h-[240px] overflow-auto rounded border p-3 text-xs" data-testid="cb-json">
              {JSON.stringify(program, null, 2)}
            </pre>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Result</div>
            <pre className="mt-2 max-h-[240px] overflow-auto rounded border p-3 text-xs" data-testid="cb-result">
              {result ? JSON.stringify(result, null, 2) : "(no result)"}
            </pre>
          </div>
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
