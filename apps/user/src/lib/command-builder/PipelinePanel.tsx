// apps/user/src/lib/command-builder/PipelinePanel.tsx
"use client";

import { useCommandBuilderStore, type CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import {
  COMMAND_CATALOG,
  RUNNER_INPUT_STEP,
  RUNNER_OUTPUT_STEP,
  RUNNER_PREPROCESS_STEPS,
  getCatalogItem,
  type CommandCatalogItem,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";
import { GesturePad } from "@/lib/command-builder/GesturePad";
import { useRunToResultButton } from "@/lib/terminal/useRunToResultButton";
import { useParams } from "next/navigation";
import * as React from "react";

function getTaskIdFromParams(params: ReturnType<typeof useParams>): string | null {
  const v = (params as any)?.taskId;
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}

function isCommandType(type: string): type is CommandType {
  return COMMAND_CATALOG.some((x) => x.type === type);
}

function getCatalogItemSafe(type: string): CommandCatalogItem | undefined {
  return isCommandType(type) ? getCatalogItem(type) : undefined;
}

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

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  index: number;
  moved: boolean;
  pointerId: number;
};

function getType(cmdValue: unknown): string {
  const any = cmdValue as any;
  if (any && typeof any === "object" && typeof any.type === "string") return any.type;
  return "UNKNOWN";
}

function getParamValue(cmdValue: unknown, key: string): unknown {
  const any = cmdValue as any;
  if (!any || typeof any !== "object") return undefined;
  if (any[key] != null) return any[key];
  const params = any.params;
  if (params && typeof params === "object" && (params as any)[key] != null) return (params as any)[key];
  return undefined;
}

function toShellLiteral(v: unknown): string {
  if (v == null) return "VALUE";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const s = String(v);
  if (/^[a-zA-Z0-9._-]+$/.test(s)) return s;
  return `'${s.replaceAll("'", `'\\''`)}'`;
}

function substituteTemplate(template: string, cmdValue: unknown): string {
  const v = getParamValue(cmdValue, "value");
  if (template.includes("VALUE")) return template.replaceAll("VALUE", toShellLiteral(v));
  return template;
}

function compactChipLabel(type: string, cmdValue: unknown): string {
  const v = getParamValue(cmdValue, "value");
  const vn = typeof v === "number" ? v : v == null ? undefined : Number(v);

  switch (type) {
    case "FILTER_GT":
      return vn != null ? `filter > ${vn}` : "filter > VALUE";
    case "FILTER_EQUALS":
      return vn != null ? `filter = ${vn}` : "filter = VALUE";
    case "MAP_ADD":
      return vn != null ? `map + ${vn}` : "map + VALUE";
    case "MAP_MUL":
      return vn != null ? `map * ${vn}` : "map * VALUE";
    case "SORT_ASC":
      return "sort asc";
    case "SORT_DESC":
      return "sort desc";
    case "OUTPUT":
      return "> output.csv";
    case "INPUT":
      return "cat input.csv";
    default:
      return type.toLowerCase();
  }
}

function coreUnixCmdFor(cmd: CommandDraft): string {
  const type = getType(cmd.value);
  const item = getCatalogItemSafe(type);
  const tpl = typeof item?.unixHint === "string" && item.unixHint.trim().length > 0 ? item.unixHint.trim() : type;
  return substituteTemplate(tpl, cmd.value);
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

  const params = useParams();
  const taskId = React.useMemo(() => getTaskIdFromParams(params), [params]);

  // コマンドが変わったら"実行"に戻す（3コマンド前後なので digest で十分）
  const programDigest = React.useMemo(() => JSON.stringify(commands.map((c) => c.value)), [commands]);

  const run = useRunToResultButton({
    taskId,
    resetKey: programDigest,
    getSubmittedProgram: () => useCommandBuilderStore.getState().serializeProgram(),
    navigateTo: "/result",
    autoNavigateOnComplete: true,
  });

  const moveCommand = useCommandBuilderStore((s) => s.move);
  const [viewMode, setViewMode] = React.useState<ViewMode>("compact");

  const canStepPlus = selectedIndex >= 0 && revealIndex < commands.length;
  const canStepMinus = selectedIndex >= 0;

  const stripRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!stripRef.current) return;
    const el = stripRef.current.querySelectorAll<HTMLElement>("[data-testid='pipe-step']")?.[selectedIndex];
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selectedIndex, viewMode]);

  const dragRef = React.useRef<DragState | null>(null);

  const onChipPointerDown = React.useCallback((e: React.PointerEvent, index: number) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      index,
      moved: false,
      pointerId: e.pointerId,
    };
  }, []);

  const onChipPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const st = dragRef.current;
      if (!st || !st.active || st.pointerId !== e.pointerId) return;

      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;

      const THRESH_X = 18;
      const THRESH_DOMINANCE = 1.2;

      if (!st.moved) {
        if (Math.abs(dx) < THRESH_X) return;
        if (Math.abs(dx) < Math.abs(dy) * THRESH_DOMINANCE) return;
        st.moved = true;
      }

      const dir = dx > 0 ? 1 : -1;
      const nextIndex = st.index + dir;
      if (nextIndex < 0 || nextIndex >= commands.length) return;

      moveCommand(st.index, nextIndex);
      st.index = nextIndex;
      st.startX = e.clientX;
      st.startY = e.clientY;
    },
    [commands.length, moveCommand]
  );

  const onChipPointerUp = React.useCallback((e: React.PointerEvent) => {
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    dragRef.current = null;
  }, []);

  const onChipPointerCancel = React.useCallback((e: React.PointerEvent) => {
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    dragRef.current = null;
  }, []);

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

  const runnerPreview = React.useMemo(() => {
    const core = commands.map((cmd) => coreUnixCmdFor(cmd));
    const pieces = [RUNNER_INPUT_STEP.cmd, ...RUNNER_PREPROCESS_STEPS.map((s) => s.cmd), ...core, RUNNER_OUTPUT_STEP.cmd];
    const last = pieces[pieces.length - 1] ?? "";
    const main = pieces.slice(0, -1).join(" | ");
    return `${main} ${last}`;
  }, [commands]);

  return (
    <aside className="rounded-lg border bg-card p-4" data-testid="pipe-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Runner</div>
          <div className="text-xs text-muted-foreground">input.csv → output.csv</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border bg-background px-3 py-1 text-sm disabled:opacity-50 hover:bg-accent"
            onClick={() => {
              if (commands.length === 0) return;
              run.onClick();
            }}
            disabled={commands.length === 0 || run.disabled}
            data-testid="runner-primary"
            title={commands.length === 0 ? "コマンドが無いので実行できない" : run.title}
          >
            {run.label}
          </button>

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
              className={`border-l px-2 py-1 ${viewMode === "detailed" ? "bg-accent" : "bg-background"}`}
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
          <div ref={stripRef} className="overflow-x-auto whitespace-nowrap font-mono text-sm">
            <span className="rounded border bg-background px-2 py-1" title={RUNNER_INPUT_STEP.cmd}>
              {RUNNER_INPUT_STEP.cmd}
            </span>

            {RUNNER_PREPROCESS_STEPS.map((s) => (
              <React.Fragment key={s.label}>
                <span className="mx-2 text-muted-foreground">|</span>
                <span className="rounded border bg-background px-2 py-1" title={s.cmd}>
                  {s.cmd}
                </span>
              </React.Fragment>
            ))}

            {commands.map((cmd, i) => {
              const type = getType(cmd.value);
              const item = getCatalogItemSafe(type);
              const tpl = typeof item?.unixHint === "string" && item.unixHint.trim().length > 0 ? item.unixHint.trim() : type;

              const unixFull = substituteTemplate(tpl, cmd.value);
              const label = compactChipLabel(type, cmd.value);
              const isSelected = selectedId != null && cmd.id === selectedId;

              return (
                <React.Fragment key={cmd.id}>
                  <span className="mx-2 text-muted-foreground">|</span>

                  <button
                    type="button"
                    className={`rounded border px-2 py-1 hover:bg-accent select-none ${
                      isSelected ? "bg-accent/60" : "bg-background"
                    } cursor-grab active:cursor-grabbing`}
                    onClick={() => onSelectStep(i)}
                    onPointerDown={(e) => onChipPointerDown(e, i)}
                    onPointerMove={onChipPointerMove}
                    onPointerUp={onChipPointerUp}
                    onPointerCancel={onChipPointerCancel}
                    title={unixFull}
                    style={{ userSelect: "none", touchAction: "pan-y" }}
                    data-testid="pipe-step"
                  >
                    {label}
                  </button>
                </React.Fragment>
              );
            })}

            <span className="mx-2 text-muted-foreground">|</span>
            <span className="rounded border bg-background px-2 py-1" title={RUNNER_OUTPUT_STEP.cmd}>
              {RUNNER_OUTPUT_STEP.cmd}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3" data-testid="pipe-detailed-view">
          <div className="rounded border bg-background p-3">
            <div className="text-xs text-muted-foreground">Runner preview</div>
            <pre className="mt-2 overflow-auto font-mono text-xs">{runnerPreview}</pre>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              step: {selectedIndex >= 0 ? `${selectedIndex + 1}/${commands.length}` : "-"}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                onClick={onStepMinus}
                disabled={!canStepMinus}
                data-testid="pipe-step-minus"
              >
                -1
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                onClick={onStepPlus}
                disabled={!canStepPlus}
                data-testid="pipe-step-plus"
              >
                +1
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                onClick={onSelectNext}
                disabled={nextTargetIndex == null}
                data-testid="pipe-step-next"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded border bg-card p-3">
            <div className="text-xs text-muted-foreground">Step</div>

            {selectedIndex < 0 ? (
              <div className="mt-2 text-sm text-muted-foreground">コマンドを選択してね。</div>
            ) : (
              <div className="mt-2 space-y-2">
                {revealed.map((cmd, idx) => {
                  const type = getType(cmd.value);
                  const item = getCatalogItemSafe(type);
                  const title = item?.label ?? type;
                  const hint = item?.unixHint ?? type;

                  const isCurrent = cmd.id === selectedId;
                  const stepIndex = selectedIndex + idx;

                  return (
                    <div key={cmd.id} className={`rounded border p-2 ${isCurrent ? "bg-accent/30" : "bg-background"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => onSelectStep(stepIndex)}
                          data-testid={`pipe-step-${stepIndex}`}
                        >
                          <div className="text-sm font-semibold">{title}</div>
                          <div className="text-xs text-muted-foreground">{hint}</div>
                        </button>

                        {isCurrent && (
                          <div data-testid="runner-gesturepad">
                            <GesturePad
                              onStepPlus={onStepPlus}
                              onStepMinus={onStepMinus}
                              canStepPlus={canStepPlus}
                              canStepMinus={canStepMinus}
                            />
                          </div>
                        )}
                      </div>

                      {typeof hint === "string" && hint.trim().length > 0 ? (
                        <pre className="mt-2 max-h-28 overflow-auto rounded border bg-background p-3 text-xs" data-testid="pipe-preview">
                          {hint}
                        </pre>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {next ? (
            <div className="rounded border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">Next</div>
              <div className="mt-1 font-mono text-sm">{compactChipLabel(getType(next.value), next.value)}</div>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}
