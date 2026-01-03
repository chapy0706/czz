// apps/user/src/lib/command-builder/PipelinePanel.tsx
"use client";

import { useCommandBuilderStore, type CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import { getCatalogItem } from "@/lib/command-builder/commandCatalog";
import { GesturePad } from "@/lib/command-builder/GesturePad";
import * as React from "react";

type Props = {
  commands: CommandDraft[];
  selectedId: string | null;

  selectedIndex: number;
  revealIndex: number;
  onStepPlus: () => void;
  onStepMinus: () => void;
  onSelectNext: () => void;
  onSelectStep: (index: number) => void;
};

type ViewMode = "compact" | "detailed";

function getType(value: unknown): string {
  if (!value || typeof value !== "object") return "UNKNOWN";
  const any = value as { type?: unknown };
  return typeof any.type === "string" ? any.type : "UNKNOWN";
}

function renderUnixBlock(item: any, fallbackType: string) {
  const rawSteps: unknown[] | undefined = Array.isArray(item?.unixSteps) ? item.unixSteps : undefined;

  const steps: string[] | undefined = rawSteps
    ? rawSteps.map((s: any) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object" && typeof s.cmd === "string") return s.cmd;
        return String(s);
      })
    : undefined;

  const hint: string | undefined = typeof item?.unixHint === "string" ? item.unixHint : undefined;

  const lines =
    steps && steps.length > 0
      ? steps
      : hint
        ? hint.split("\n").filter((x) => x.trim().length > 0)
        : [`(no unix template for ${fallbackType})`];

  return (
    <pre
      className="mt-2 max-h-28 overflow-auto rounded border bg-background p-3 text-xs"
      data-testid="pipe-preview"
    >
      {lines.join("\n")}
    </pre>
  );
}

export function PipelinePanel(props: Props) {
  const {
    commands,
    selectedId,
    selectedIndex,
    revealIndex,
    onStepPlus,
    onStepMinus,
    onSelectNext,
    onSelectStep,
  } = props;

  const moveCommand = useCommandBuilderStore((s) => s.move);

  const [viewMode, setViewMode] = React.useState<ViewMode>("compact");

  const canStepPlus = selectedIndex >= 0 && revealIndex < commands.length - 1;
  const canStepMinus = selectedIndex >= 0 && revealIndex > selectedIndex;

  const selectedCommandIndex = React.useMemo(() => {
    if (selectedId == null) return -1;
    return commands.findIndex((c) => c.id === selectedId);
  }, [commands, selectedId]);

  const canMoveLeft = selectedCommandIndex > 0;
  const canMoveRight = selectedCommandIndex >= 0 && selectedCommandIndex < commands.length - 1;

  const handleMoveSelected = React.useCallback(
    (delta: -1 | 1) => {
      if (selectedCommandIndex < 0) return;
      const to = selectedCommandIndex + delta;
      if (to < 0 || to >= commands.length) return;

      moveCommand(selectedCommandIndex, to);
      onSelectStep(to);
    },
    [commands.length, moveCommand, onSelectStep, selectedCommandIndex],
  );

  const revealed = React.useMemo(() => {
    if (selectedIndex < 0) return [];
    const from = selectedIndex;
    const to = Math.min(Math.max(revealIndex, selectedIndex), commands.length - 1);
    return commands.slice(from, to + 1);
  }, [commands, selectedIndex, revealIndex]);

  const nextTargetIndex = React.useMemo(() => {
    if (selectedIndex < 0) return null;
    const idx = selectedIndex + 1;
    if (revealIndex <= selectedIndex) return null;
    if (idx > revealIndex) return null;
    if (idx < 0 || idx >= commands.length) return null;
    return idx;
  }, [commands.length, selectedIndex, revealIndex]);

  const next = React.useMemo(() => {
    if (nextTargetIndex == null) return null;
    return commands[nextTargetIndex] ?? null;
  }, [commands, nextTargetIndex]);

  return (
    <aside className="rounded-lg border bg-card p-4" data-testid="pipe-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Runner</div>
          <div className="text-xs text-muted-foreground">input.csv → output.csv</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border text-xs" data-testid="pipe-view-toggle">
            <button
              type="button"
              className={`px-2 py-1 ${viewMode === "compact" ? "bg-accent" : "bg-background"}`}
              onClick={() => setViewMode("compact")}
              data-testid="pipe-view-compact"
              aria-pressed={viewMode === "compact"}
            >
              短い
            </button>
            <button
              type="button"
              className={`border-l px-2 py-1 ${
                viewMode === "detailed" ? "bg-accent" : "bg-background"
              }`}
              onClick={() => setViewMode("detailed")}
              data-testid="pipe-view-detailed"
              aria-pressed={viewMode === "detailed"}
            >
              詳細
            </button>
          </div>
        </div>
      </div>

      {commands.length === 0 ? (
        <div className="mt-4 rounded border px-3 py-6 text-sm text-muted-foreground">
          まだコマンドがないよ。追加して Runner を組み立てよう。
        </div>
      ) : viewMode === "compact" ? (
        <div className="mt-4 rounded border bg-muted/30 px-3 py-2" data-testid="pipe-compact-view">
          <div className="overflow-x-auto whitespace-nowrap font-mono text-sm">
            <span className="rounded border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
              input.csv
            </span>

            {commands.map((cmd, i) => {
              const type = getType(cmd.value);
              const item = getCatalogItem(type as any);

              const raw =
                typeof item?.unixHint === "string" && item.unixHint.trim().length > 0
                  ? item.unixHint.trim().split("\n")[0]
                  : type;

              const isSelected = selectedId != null && cmd.id === selectedId;

              return (
                <React.Fragment key={cmd.id}>
                  <span className="mx-2 text-muted-foreground">|</span>

                  <span className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className={`rounded border px-2 py-1 hover:bg-accent ${
                        isSelected ? "bg-accent/60" : "bg-background"
                      }`}
                      onClick={() => onSelectStep(i)}
                      title={raw}
                      data-testid="pipe-step"
                    >
                      {raw}
                    </button>

                    {isSelected ? (
                      <>
                        <button
                          type="button"
                          className="rounded border bg-background px-1.5 py-1 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => handleMoveSelected(-1)}
                          disabled={!canMoveLeft}
                          title="左へ移動"
                          aria-label="move left"
                          data-testid="pipe-move-left"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          className="rounded border bg-background px-1.5 py-1 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => handleMoveSelected(1)}
                          disabled={!canMoveRight}
                          title="右へ移動"
                          aria-label="move right"
                          data-testid="pipe-move-right"
                        >
                          →
                        </button>
                      </>
                    ) : null}
                  </span>
                </React.Fragment>
              );
            })}

            <span className="mx-2 text-muted-foreground">&gt;</span>
            <span className="rounded border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
              output.csv
            </span>
          </div>

          {selectedCommandIndex >= 0 ? (
            <div className="mt-2 text-xs text-muted-foreground">
              選択中のコマンドは ← / → で並べ替えできる
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {selectedIndex < 0 ? (
            <div className="rounded border px-3 py-6 text-sm text-muted-foreground">
              詳細を見るにはコマンドを選択してね。
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto" data-testid="pipe-strip">
                {revealed.map((cmd, j) => {
                  const type = getType(cmd.value);
                  const item = getCatalogItem(type as any);
                  const stepNo = selectedIndex + j;

                  return (
                    <div
                      key={cmd.id}
                      className="w-[300px] shrink-0 rounded border bg-background p-3 hover:bg-accent"
                      onClick={() => onSelectStep(stepNo)}
                    >
                      <div className="font-mono text-sm">{type}</div>
                      {renderUnixBlock(item, type)}
                    </div>
                  );
                })}
              </div>

              <div data-testid="runner-gesturepad">
                <GesturePad
                  onStepPlus={onStepPlus}
                  onStepMinus={onStepMinus}
                  canStepPlus={canStepPlus}
                  canStepMinus={canStepMinus}
                />
              </div>

              <div className="rounded border p-3">
                <div className="text-xs font-medium text-muted-foreground">Next Step</div>
                {next ? (
                  <button
                    type="button"
                    className="mt-2 w-full rounded border bg-background px-3 py-2 text-left hover:bg-accent"
                    onClick={onSelectNext}
                    data-testid="pipe-next"
                  >
                    <div className="font-mono">{getType(next.value)}</div>
                  </button>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">(no next)</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
