// apps/user/src/lib/command-builder/PipelinePanel.tsx
"use client";

import { useCommandBuilderStore, type CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import {
  RUNNER_INPUT_STEP,
  RUNNER_OUTPUT_STEP,
  RUNNER_PREPROCESS_STEPS,
  getCatalogItem,
} from "@/lib/command-builder/commandCatalog";
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

function getParamValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  const any = value as Record<string, unknown>;
  return any[key];
}

function toShellLiteral(x: unknown): string {
  if (typeof x === "number") return Number.isFinite(x) ? String(x) : "0";
  if (typeof x === "string") return JSON.stringify(x);
  if (typeof x === "boolean") return x ? "1" : "0";
  return "0";
}

function substituteTemplate(template: string, cmdValue: unknown): string {
  const v = getParamValue(cmdValue, "value");
  if (template.includes("VALUE")) return template.replaceAll("VALUE", toShellLiteral(v));
  return template;
}

/**
 * compact は “短く意味が伝わる” 表現に寄せる（VALUE テンプレで混乱しにくい）
 * NOTE: ここは教材方針に合わせて随時調整してOK。
 */
function compactChipLabel(type: string, cmdValue: unknown): string {
  const v = getParamValue(cmdValue, "value");
  const vn = typeof v === "number" ? v : v == null ? undefined : Number(v);

  switch (type) {
    case "FILTER_EQUALS":
      return `awk '$1==${vn ?? "v"}'`;
    case "FILTER_NOT_EQUALS":
      return `awk '$1!=${vn ?? "v"}'`;
    case "FILTER_GT":
      return `awk '$1>${vn ?? "v"}'`;
    case "MAP_ADD":
      return `awk '{+${vn ?? "v"}}'`;
    case "MAP_MULTIPLY":
      return `awk '{*${vn ?? "v"}}'`;
    case "SORT_ASC":
      return "sort -n";
    case "SORT_DESC":
      return "sort -nr";
    case "OUTPUT_FIRST":
      return "head -n 1";
    case "OUTPUT_LAST":
      return "tail -n 1";
    case "OUTPUT_SUM":
      return "sum";
    default:
      return type;
  }
}

function buildFullPipelinePreview(commands: CommandDraft[]): string {
  const core = commands.map((cmd) => {
    const type = getType(cmd.value);
    const item = getCatalogItem(type as any);
    const tpl =
      typeof item?.unixHint === "string" && item.unixHint.trim().length > 0 ? item.unixHint.trim() : type;
    return substituteTemplate(tpl, cmd.value);
  });

  const pieces = [
    RUNNER_INPUT_STEP.cmd,
    ...RUNNER_PREPROCESS_STEPS.map((s) => s.cmd),
    ...core,
    RUNNER_OUTPUT_STEP.cmd,
  ];

  const last = pieces[pieces.length - 1] ?? "";
  const main = pieces.slice(0, -1).join(" | ");
  return `${main} ${last}`;
}

type DragState = {
  pointerId: number;
  pointerType: string;
  fromIndex: number;

  startX: number;
  startY: number;

  armed: boolean; // 長押し(タッチ) or 即時(マウス)で true
  longPressTimer: number | null;

  lastScrollLeft: number;
  lastMoveAt: number; // 連続移動のデバウンス
};

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

  const stripRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<DragState | null>(null);

  // 選択中のコマンドを常に視界に入れる（長いパイプでも迷子にならない）
  React.useEffect(() => {
    if (viewMode !== "compact") return;
    if (!selectedId) return;
    const el = stripRef.current;
    if (!el) return;

    // DOM が更新された後に追従（連続更新時のチラつきを抑える）
    const raf = window.requestAnimationFrame(() => {
      const target = el.querySelector<HTMLElement>(`[data-cmdid="${selectedId}"]`);
      if (!target) return;
      target.scrollIntoView({ block: "nearest", inline: "center" });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [viewMode, selectedId]);

  const handleMoveAt = React.useCallback(
    (fromIndex: number, delta: -1 | 1) => {
      const to = fromIndex + delta;
      if (fromIndex < 0) return;
      if (to < 0 || to >= commands.length) return;

      moveCommand(fromIndex, to);
      onSelectStep(to);
    },
    [commands.length, moveCommand, onSelectStep],
  );

  const clearLongPress = React.useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    if (d.longPressTimer != null) {
      window.clearTimeout(d.longPressTimer);
      d.longPressTimer = null;
    }
  }, []);

  const cancelDrag = React.useCallback(() => {
    clearLongPress();
    dragRef.current = null;
  }, [clearLongPress]);

  const shouldTreatAsScroll = React.useCallback((d: DragState) => {
    const el = stripRef.current;
    if (!el) return false;
    const now = el.scrollLeft;
    const delta = Math.abs(now - d.lastScrollLeft);
    d.lastScrollLeft = now;
    return delta > 2;
  }, []);

  const isHorizontalGesture = (dx: number, dy: number, thresholdPx: number) => {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < thresholdPx) return false;
    if (absX < absY * 1.2) return false;
    return true;
  };

  const tryReorder = React.useCallback(
    (clientX: number, clientY: number) => {
      const d = dragRef.current;
      if (!d) return;

      const now = Date.now();
      if (now - d.lastMoveAt < 120) return;

      const dx = clientX - d.startX;
      const dy = clientY - d.startY;

      const threshold = d.pointerType === "mouse" ? 36 : 44;
      if (!isHorizontalGesture(dx, dy, threshold)) return;

      const dir: -1 | 1 = dx < 0 ? -1 : 1;
      const to = d.fromIndex + dir;
      if (to < 0 || to >= commands.length) return;

      handleMoveAt(d.fromIndex, dir);

      d.fromIndex = to;
      d.startX = clientX;
      d.startY = clientY;
      d.lastMoveAt = now;
    },
    [commands.length, handleMoveAt],
  );

  const onChipPointerDown = React.useCallback(
    (e: React.PointerEvent, fromIndex: number) => {
      const pt = e.pointerType ?? "mouse";
      if (pt === "mouse" && e.button !== 0) return;

      onSelectStep(fromIndex);

      const el = stripRef.current;
      const d: DragState = {
        pointerId: e.pointerId,
        pointerType: pt,
        fromIndex,
        startX: e.clientX,
        startY: e.clientY,
        armed: pt === "mouse",
        longPressTimer: null,
        lastScrollLeft: el?.scrollLeft ?? 0,
        lastMoveAt: 0,
      };

      dragRef.current = d;

      if (pt !== "mouse") {
        d.longPressTimer = window.setTimeout(() => {
          const cur = dragRef.current;
          if (!cur || cur.pointerId !== e.pointerId) return;
          cur.armed = true;
        }, 180);
      }

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [onSelectStep],
  );

  const onChipPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;

      if ((e.pointerType ?? "mouse") === "mouse" && (e.buttons & 1) !== 1) {
        cancelDrag();
        return;
      }

      if (shouldTreatAsScroll(d)) {
        clearLongPress();
        d.armed = false;
        return;
      }

      if (!d.armed && d.pointerType !== "mouse") {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.abs(dx) + Math.abs(dy) > 12) {
          clearLongPress();
          cancelDrag();
          return;
        }
        return;
      }

      if (!d.armed) return;

      tryReorder(e.clientX, e.clientY);
    },
    [cancelDrag, clearLongPress, shouldTreatAsScroll, tryReorder],
  );

  const onChipPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;

      clearLongPress();
      dragRef.current = null;
    },
    [clearLongPress],
  );

  const onChipPointerCancel = React.useCallback(() => {
    cancelDrag();
  }, [cancelDrag]);

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
              const item = getCatalogItem(type as any);
              const unixTemplate =
                typeof item?.unixHint === "string" && item.unixHint.trim().length > 0
                  ? item.unixHint.trim()
                  : type;

              const unixFull = substituteTemplate(unixTemplate, cmd.value);
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
                    aria-label={`step-${i + 1}-${type}`}
                    data-cmdid={cmd.id}
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

          <div className="mt-2 text-xs text-muted-foreground">
            ドラッグで並べ替え。スマホは長押ししてから左右に動かす。
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded border bg-muted/30 px-3 py-2">
            <div className="text-xs font-medium text-muted-foreground">Pipeline</div>
            <pre className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-xs">
{buildFullPipelinePreview(commands)}
            </pre>
          </div>

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

                  const unixTemplate =
                    typeof item?.unixHint === "string" && item.unixHint.trim().length > 0
                      ? item.unixHint.trim()
                      : type;
                  const unixFull = substituteTemplate(unixTemplate, cmd.value);

                  return (
                    <div
                      key={cmd.id}
                      className="w-[320px] shrink-0 rounded border bg-background p-3 hover:bg-accent"
                      onClick={() => onSelectStep(stepNo)}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-mono text-sm">{type}</div>
                        <div className="text-xs text-muted-foreground">#{stepNo + 1}</div>
                      </div>

                      <pre
                        className="mt-2 max-h-28 overflow-auto rounded border bg-background p-3 text-xs"
                        data-testid="pipe-preview"
                      >
{unixFull}
                      </pre>
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
