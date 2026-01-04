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
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

const LAST_RESULT_STORAGE_KEY = "czz-terminal-last-result";

function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(x, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    return "";
  }
}

function persistLastResult(taskId: string, response: unknown): boolean {
  const payload = { savedAt: Date.now(), meta: { taskId }, response };
  const json = safeStringify(payload);
  if (!json) return false;

  try {
    localStorage.setItem(LAST_RESULT_STORAGE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

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

/**
 * 短い表示では “学習者が一瞬で意味を取れる” 表現に寄せる
 */
function compactChipLabel(type: string, cmdValue: unknown): string {
  const v = getParamValue(cmdValue, "value");
  const vn = typeof v === "number" ? v : v == null ? undefined : Number(v);

  switch (type) {
    case "FILTER_GT":
      return vn != null ? `filter > ${vn}` : "filter > VALUE";
    case "FILTER_EQUALS":
      return vn != null ? `filter = ${vn}` : "filter = VALUE";
    case "FILTER_NOT_EQUALS":
      return vn != null ? `filter != ${vn}` : "filter != VALUE";
    case "MAP_ADD":
      return vn != null ? `map + ${vn}` : "map + VALUE";
    case "MAP_MULTIPLY":
      return vn != null ? `map × ${vn}` : "map × VALUE";
    case "SORT_ASC":
      return "sort asc";
    case "SORT_DESC":
      return "sort desc";
    case "OUTPUT_FIRST":
      return "head";
    case "OUTPUT_LAST":
      return "tail";
    case "OUTPUT_SUM":
      return "sum";
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

  const router = useRouter();
  const params = useParams();
  const taskId = React.useMemo(() => getTaskIdFromParams(params), [params]);

  type RunPhase = "idle" | "running" | "ready";
  const [runPhase, setRunPhase] = React.useState<RunPhase>("idle");
  const [canOpenResult, setCanOpenResult] = React.useState(false);

  // コマンドが変わったら「実行」に戻す（3コマンド前後なので digest で十分）
  const programDigest = React.useMemo(() => JSON.stringify(commands.map((c) => c.value)), [commands]);
  React.useEffect(() => {
    setRunPhase("idle");
    setCanOpenResult(false);
  }, [programDigest, taskId]);

  const onRunnerPrimary = React.useCallback(async () => {
    if (runPhase === "ready") {
      router.push("/result");
      return;
    }
    if (runPhase === "running") return;
    if (!taskId) return;
    if (commands.length === 0) return;

    setRunPhase("running");

    try {
      const submittedProgram = useCommandBuilderStore.getState().serializeProgram();
      const res: unknown = await evaluateTask({ taskId, submittedProgram });

      const saved = persistLastResult(taskId, res);
      setCanOpenResult(saved);
      setRunPhase("ready");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      const errRes = { ok: false, error: { kind: "NETWORK", message, details: e } };

      const saved = persistLastResult(taskId, errRes);
      setCanOpenResult(saved);
      setRunPhase("ready");
    }
  }, [router, runPhase, taskId, commands.length]);

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

      if (Math.abs(dx) < THRESH_X) return;
      if (Math.abs(dx) < Math.abs(dy) * THRESH_DOMINANCE) return;

      if (!st.moved) st.moved = true;

      const dir = dx > 0 ? 1 : -1;
      const from = st.index;
      const to = from + dir;

      if (to < 0 || to >= commands.length) return;

      moveCommand(from, to);
      onSelectStep(to);

      dragRef.current = { ...st, startX: e.clientX, startY: e.clientY, index: to };
    },
    [commands.length, moveCommand, onSelectStep],
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

  // 詳細ビューの Runner プレビュー用（重複しない構成：input + preprocess + coreCmds + output）
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
            onClick={onRunnerPrimary}
            disabled={!taskId || commands.length === 0 || runPhase === "running"}
            data-testid="runner-primary"
            title={
              !taskId
                ? "taskId が無いので実行できない"
                : commands.length === 0
                  ? "コマンドが無いので実行できない"
                  : runPhase === "ready" && !canOpenResult
                    ? "結果の保存に失敗した（/result は空になる可能性がある）"
                    : runPhase === "ready"
                      ? "結果画面へ"
                      : "実行"
            }
          >
            {runPhase === "running" ? "判定中…" : runPhase === "ready" ? "結果へ進む" : "実行"}
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

          <div className="mt-2 text-xs text-muted-foreground" data-testid="pipe-compact-note">
            コマンドは横フリックで並べ替えできる（選択はクリック）
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4" data-testid="pipe-detailed-view">
          <div className="rounded border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground">Runner</div>
            <div className="mt-2 space-y-2 font-mono text-sm" data-testid="pipe-preview">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border bg-background px-2 py-1">{RUNNER_INPUT_STEP.cmd}</span>

                {RUNNER_PREPROCESS_STEPS.map((s) => (
                  <React.Fragment key={s.label}>
                    <span className="text-muted-foreground">|</span>
                    <span className="rounded border bg-background px-2 py-1">{s.cmd}</span>
                  </React.Fragment>
                ))}

                {commands.map((cmd) => {
                  const unixFull = coreUnixCmdFor(cmd);
                  return (
                    <React.Fragment key={cmd.id}>
                      <span className="text-muted-foreground">|</span>
                      <span className="rounded border bg-background px-2 py-1">{unixFull}</span>
                    </React.Fragment>
                  );
                })}

                <span className="text-muted-foreground">|</span>
                <span className="rounded border bg-background px-2 py-1">{RUNNER_OUTPUT_STEP.cmd}</span>
              </div>

              <div className="text-xs text-muted-foreground" data-testid="pipe-preview-note">
                input/output は Runner パネル側で見える。ここは “中間コマンド” を読む練習用。
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border p-3">
              <div className="text-xs font-medium text-muted-foreground">Selected</div>

              {selectedIndex < 0 || !commands[selectedIndex] ? (
                <div className="mt-2 text-sm text-muted-foreground">(none)</div>
              ) : (() => {
                  const cmd = commands[selectedIndex]!;
                  const type = getType(cmd.value);
                  const item = getCatalogItemSafe(type);

                  const title = item?.label ?? type;
                  const template =
                    typeof item?.unixHint === "string" && item.unixHint.trim().length > 0 ? item.unixHint.trim() : type;
                  const unixFull = substituteTemplate(template, cmd.value);

                  return (
                    <div className="mt-2 space-y-2">
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="rounded border bg-muted/30 p-2 font-mono text-sm" data-testid="pipe-selected">
                        {unixFull}
                      </div>

                      {item?.params && item.params.length > 0 ? (
                        <div className="text-sm text-muted-foreground">
                          {item.params.map((p) => (
                            <div key={p.key} className="flex gap-2">
                              <span className="font-mono">{p.key}</span>
                              <span>({p.kind})</span>
                              <span className="opacity-70">{p.required ? "required" : "optional"}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
            </div>

            <div className="space-y-3">
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

              <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
                ヒント：短い表示は “形を覚える”。詳細は “意味を読む”。
              </div>
            </div>
          </div>

          <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
            full preview: <span className="font-mono">{runnerPreview}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
