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
};

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
    <pre className="mt-2 overflow-auto rounded border bg-background p-3 text-xs" data-testid="pipe-preview">
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
  } = props;

  const canStepPlus = selectedIndex >= 0 && revealIndex < commands.length - 1;
  const canStepMinus = selectedIndex >= 0 && revealIndex > selectedIndex;

  const revealed = React.useMemo(() => {
    if (selectedIndex < 0) return [];
    const from = selectedIndex;
    const to = Math.min(Math.max(revealIndex, selectedIndex), commands.length - 1);
    return commands.slice(from, to + 1);
  }, [commands, selectedIndex, revealIndex]);

  const next = React.useMemo(() => {
    if (selectedIndex < 0) return null;
    const idx = revealIndex + 1;
    if (idx < 0 || idx >= commands.length) return null;
    return commands[idx] ?? null;
  }, [commands, selectedIndex, revealIndex]);

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
          <div className="mt-4 space-y-3">
            {revealed.map((cmd, i) => {
              const type = getType(cmd.value);
              const item = getCatalogItem(type as any);
              const stepNo = selectedIndex + i;

              return (
                <div key={cmd.id} className="rounded border p-3" data-testid={`pipe-step-${stepNo}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{type}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {JSON.stringify(cmd.value)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">step {stepNo - selectedIndex + 1}</div>
                  </div>

                  {renderUnixBlock(item, type)}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <GesturePad
              onStepPlus={onStepPlus}
              onStepMinus={onStepMinus}
              canStepPlus={canStepPlus}
              canStepMinus={canStepMinus}
            />
          </div>

          <div className="mt-4 rounded border p-3">
            <div className="text-xs font-medium text-muted-foreground">Next Command</div>

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
                  タップで次のコマンドに進む（選択も移動）
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
