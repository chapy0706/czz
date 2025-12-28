// apps/user/src/lib/components/command-builder/PipelinePanel.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import { getCatalogItem } from "@/lib/command-builder/commandCatalog";
import { GesturePad } from "@/lib/command-builder/GesturePad";
import * as React from "react";

type Props = {
  commands: CommandDraft[];
  selectedId: string | null;

  selectedIndex: number; // -1 の場合は未選択
  revealIndex: number; // selectedIndex..(commands.length-1)
  onStepPlus: () => void;
  onStepMinus: () => void;

  onSelectNext: () => void;

  // NEW: 表示されている Step をタップして、その index を選択にする
  onSelectStep: (index: number) => void;
};

type ViewMode = "compact" | "detailed";

function getType(value: unknown): string {
  if (!value || typeof value !== "object") return "UNKNOWN";
  const any = value as { type?: unknown };
  return typeof any.type === "string" ? any.type : "UNKNOWN";
}

/**
 * 表示側の安全策：
 * - catalog.unixHint が 1行文字列でも、複数行でも読めるようにする
 * - catalog.unixSteps が将来追加されても受けられるようにする
 */
function renderUnixBlock(item: any, fallbackType: string) {
  const steps: string[] | undefined = Array.isArray(item?.unixSteps) ? item.unixSteps : undefined;
  const hint: string | undefined = typeof item?.unixHint === "string" ? item.unixHint : undefined;

  const lines =
    steps && steps.length > 0
      ? steps
      : hint
        ? hint.split("\n").filter((x) => x.trim().length > 0)
        : [`(no unix template for ${fallbackType})`];

  return (
    <pre className="mt-2 max-h-28 overflow-auto rounded border bg-background p-3 text-xs" data-testid="pipe-preview">
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

  const [viewMode, setViewMode] = React.useState<ViewMode>("detailed");

  const canStepPlus = selectedIndex >= 0 && revealIndex < commands.length - 1;
  const canStepMinus = selectedIndex >= 0 && revealIndex > selectedIndex;

  const revealed = React.useMemo(() => {
    if (selectedIndex < 0) return [];
    const from = selectedIndex;
    const to = Math.min(Math.max(revealIndex, selectedIndex), commands.length - 1);
    return commands.slice(from, to + 1);
  }, [commands, selectedIndex, revealIndex]);

  /**
   * “Next” は「いま +Step で表示された次の段（= revealIndex）」へ選択を移す。
   * 表示も実行も同じターゲットになるようにする。
   *
   * - revealIndex === selectedIndex の間は “次が無い” 扱い（まだ +Step してない）
   */
  const nextTargetIndex = React.useMemo(() => {
    if (selectedIndex < 0) return null;
    // Next は「1つ先」。ただし reveal 済み（表示済み）であること。
    const idx = selectedIndex + 1;
    if (revealIndex <= selectedIndex) return null; // まだ +Step してない
    if (idx > revealIndex) return null;            // まだその段は表示してない
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
          <div className="text-sm font-semibold">Pipeline Panel</div>
          <div className="text-xs text-muted-foreground">
            前提: <span className="font-mono">input.csv</span>（ヘッダあり）/ 1列目（数値）/{" "}
            <span className="font-mono">output.csv</span> に上書き（<span className="font-mono">{">"}</span>）
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border text-xs" data-testid="pipe-view-toggle">
            <button
              type="button"
              className={[
                "px-2 py-1",
                "disabled:opacity-50",
                viewMode === "compact" ? "bg-accent" : "bg-background",
              ].join(" ")}
              onClick={() => setViewMode("compact")}
              data-testid="pipe-view-compact"
              aria-pressed={viewMode === "compact"}
              title="短い表示"
            >
              短い
            </button>
            <button
              type="button"
              className={[
                "px-2 py-1 border-l",
                "disabled:opacity-50",
                viewMode === "detailed" ? "bg-accent" : "bg-background",
              ].join(" ")}
              onClick={() => setViewMode("detailed")}
              data-testid="pipe-view-detailed"
              aria-pressed={viewMode === "detailed"}
              title="詳細表示"
            >
              詳細
            </button>
          </div>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs disabled:opacity-50"
            onClick={onStepMinus}
            disabled={!canStepMinus}
            data-testid="pipe-step-minus"
            title="(- Step)"
          >
            - Step
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs disabled:opacity-50"
            onClick={onStepPlus}
            disabled={!canStepPlus}
            data-testid="pipe-step-plus"
            title="(+ Step)"
          >
            + Step
          </button>
        </div>
      </div>

      {selectedId == null || selectedIndex < 0 ? (
        <div className="mt-4 rounded border px-3 py-6 text-sm text-muted-foreground">
          左の Pipeline（CommandList）から最初のコマンドを選択すると、ここに段階表示が出る。
        </div>
      ) : (
        <>
          {viewMode === "compact" ? (
            <div
              className="mt-4 rounded border bg-muted/30 px-3 py-2 font-mono text-sm leading-6"
              data-testid="pipe-compact-view"
              aria-label="pipeline compact view"
            >
              {revealed.length === 0 ? (
                <span className="text-muted-foreground">(no pipeline)</span>
              ) : (
                revealed.map((cmd, i) => {
                  const type = getType(cmd.value);
                  const isLast = i === revealed.length - 1;
                  return (
                    <span key={cmd.id}>
                      <span className="whitespace-nowrap">{type}</span>
                      {!isLast ? <span className="mx-2 text-muted-foreground">|</span> : null}
                    </span>
                  );
                })
              )}
            </div>
          ) : (
            <div
              className="mt-4 flex items-stretch gap-2 overflow-x-auto pb-2"
              data-testid="pipe-strip"
            >
              {revealed.map((cmd, i) => {
                const type = getType(cmd.value);
                const item = getCatalogItem(type as any);
                const stepNo = selectedIndex + i;
                const isAnchor = stepNo === selectedIndex;

                return (
                  <React.Fragment key={cmd.id}>
                    {i > 0 ? (
                      <div
                        className="flex w-6 shrink-0 items-center justify-center text-muted-foreground"
                        aria-hidden="true"
                        data-testid={`pipe-bar-${stepNo}`}
                      >
                        |
                      </div>
                    ) : null}

                    <div
                      className={[
                        "shrink-0 rounded border bg-background p-3",
                        "cursor-pointer select-none",
                        "w-[280px] sm:w-[320px]",
                        isAnchor ? "ring-2 ring-offset-2" : "hover:bg-accent",
                      ].join(" ")}
                      data-testid={`pipe-step-${stepNo}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select step ${stepNo}`}
                      onClick={() => onSelectStep(stepNo)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectStep(stepNo);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-mono text-sm">{type}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {JSON.stringify(cmd.value)}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          step {stepNo - selectedIndex + 1}
                          {isAnchor ? " (anchor)" : ""}
                        </div>
                      </div>

                      {renderUnixBlock(item, type)}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <GesturePad
              onStepPlus={onStepPlus}
              onStepMinus={onStepMinus}
              canStepPlus={canStepPlus}
              canStepMinus={canStepMinus}
            />
          </div>

          <div className="mt-4 rounded border p-3">
            <div className="text-xs font-medium text-muted-foreground">Next Step</div>

            {next ? (
              <button
                type="button"
                className="mt-2 w-full rounded border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={onSelectNext}
                data-testid="pipe-next"
              >
                <div className="font-mono">{getType(next.value)}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {JSON.stringify(next.value)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  タップで「いま表示されている次の段」に進む（選択も移動）
                </div>
              </button>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">(no next)</div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}