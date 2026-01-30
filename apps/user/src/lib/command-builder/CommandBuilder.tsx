// apps/user/src/lib/command-builder/CommandBuilder.tsx
"use client";

import * as React from "react";

import {
  useCommandBuilderStore,
  type CommandDraft,
} from "@/lib/command-builder/commandBuilderStore";
import { CommandList } from "@/lib/command-builder/CommandList";
import { CommandPalette } from "@/lib/command-builder/CommandPalette";
import { PipelinePanel } from "@/lib/command-builder/PipelinePanel";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { safeStringify } from "@/lib/utils/safeStringify";

type Task = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
};

type Props = {
  task: Task;
  userId?: string;
};

type UiModeForPanels = "beginner" | "normal";

export function CommandBuilder(props: Props) {
  const { task, userId } = props;

  // "advanced" | "beginner"
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";
  const uiModeForPanels: UiModeForPanels = isBeginner ? "beginner" : "normal";

  const initForTask = useCommandBuilderStore((s) => s.initForTask);
  React.useEffect(() => {
    if (!task.id) return;
    initForTask(task.id);
  }, [task.id, initForTask]);

  const commands = useCommandBuilderStore((s) => s.commands);
  const selectedId = useCommandBuilderStore((s) => s.selectedId);
  const editingId = useCommandBuilderStore((s) => s.editingId);

  const select = useCommandBuilderStore((s) => s.select);
  const openEditor = useCommandBuilderStore((s) => s.openEditor);
  const closeEditor = useCommandBuilderStore((s) => s.closeEditor);

  const add = useCommandBuilderStore((s) => s.add);
  const remove = useCommandBuilderStore((s) => s.remove);
  const updateCommandJson = useCommandBuilderStore((s) => s.updateCommandJson);

  // Step UI state (PipelinePanel 用)
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [revealIndex, setRevealIndex] = React.useState(0);

  React.useEffect(() => {
    const idx = commands.findIndex((c) => c.id === selectedId);
    setSelectedIndex(idx);
    setRevealIndex((v) => (idx >= 0 ? Math.max(v, idx) : v));
  }, [commands, selectedId]);

  const onReorder = React.useCallback((fromIndex: number, toIndex: number) => {
    useCommandBuilderStore.getState().move(fromIndex, toIndex);
  }, []);

  const onStepPlus = React.useCallback(() => {
    setRevealIndex((v) => Math.min(v + 1, commands.length));
  }, [commands.length]);

  const onStepMinus = React.useCallback(() => {
    setRevealIndex((v) => Math.max(v - 1, 0));
  }, []);

  const onSelectNext = React.useCallback(() => {
    if (commands.length === 0) return;

    if (selectedIndex < 0) {
      select(commands[0]!.id);
      return;
    }

    const next = Math.min(selectedIndex + 1, commands.length - 1);
    select(commands[next]!.id);
  }, [commands, selectedIndex, select]);

  const onSelectStep = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= commands.length) return;
      select(commands[index]!.id);
      setRevealIndex((v) => Math.max(v, index));
    },
    [commands, select],
  );

  const editingCommand = React.useMemo<CommandDraft | null>(() => {
    if (!editingId) return null;
    return commands.find((c) => c.id === editingId) ?? null;
  }, [commands, editingId]);

  const programDigest = React.useMemo(
    () => safeStringify(commands.map((c) => c.value)),
    [commands],
  );

  const runButtonProps = React.useMemo(
    () => ({
      taskId: task.id,
      userId,
      resetKey: programDigest,
      getSubmittedProgram: () =>
        useCommandBuilderStore.getState().serializeProgram(),
      navigateTo: "/result",
      autoNavigateOnComplete: true as const,
    }),
    [task.id, userId, programDigest],
  );

  return (
    <div className="space-y-4">
      {/* TaskHeader は Props 契約がズレやすいので、この場で最小表示に固定 */}
      <header className="rounded border p-4">
        <div className="text-lg font-semibold">{task.title}</div>
        {task.description ? (
          <div className="mt-1 whitespace-pre-wrap text-sm opacity-80">
            {task.description}
          </div>
        ) : null}
      </header>

      <CommandPalette
        onAdd={add}
        runButton={runButtonProps}
        uiMode={uiModeForPanels}
      />

      {commands.length > 0 ? (
        <CommandList
          // CommandList 側の契約に合わせる（onEdit / selectedId は null 許容）
          commands={commands as any}
          selectedId={selectedId}
          onSelect={(id) => select(id)}
          onEdit={(id) => openEditor(id)}
          onRemove={(id) => remove(id)}
          onReorder={onReorder}
          layout={isBeginner ? "horizontal" : "vertical"}
        />
      ) : (
        <div className="rounded border p-4 text-sm opacity-70">
          コマンドを追加してね
        </div>
      )}

      {/* 初心者モードでは Pipeline を強制しない（Runner I/O 選択も不要） */}
      {!isBeginner && commands.length > 0 ? (
        <PipelinePanel
          uiMode={uiModeForPanels}
          commands={commands as any}
          selectedId={selectedId}
          selectedIndex={selectedIndex}
          revealIndex={revealIndex}
          onStepPlus={onStepPlus}
          onStepMinus={onStepMinus}
          onSelectNext={onSelectNext}
          onSelectStep={onSelectStep}
        />
      ) : null}
    </div>
  );
}
