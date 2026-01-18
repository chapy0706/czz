// apps/user/src/lib/command-builder/CommandPalette.tsx
"use client";

import {
  COMMAND_CATALOG,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";
import { useRunToResultButton } from "@/lib/terminal/useRunToResultButton";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { useRouter } from "next/navigation";
import * as React from "react";

type RunButtonConfig = {
  taskId: string | null;
  resetKey: string;
  getSubmittedProgram: () => unknown;
  userId?: string;
  navigateTo?: string;
  autoNavigateOnComplete?: boolean;
};

type Props = {
  onAdd: (type: CommandType) => void;
  runButton?: RunButtonConfig;
};

export function CommandPalette(props: Props) {
  const { onAdd, runButton } = props;

  const router = useRouter();
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const items = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return COMMAND_CATALOG;

    return COMMAND_CATALOG.filter((x) => {
      const extra = (x.beginnerSearchKeywords ?? []).join(" ").toLowerCase();
      const beginnerText =
        `${x.beginnerLabel ?? ""} ${x.beginnerDescription ?? ""}`.toLowerCase();

      return (
        x.type.toLowerCase().includes(query) ||
        x.label.toLowerCase().includes(query) ||
        x.unixHint.toLowerCase().includes(query) ||
        beginnerText.includes(query) ||
        extra.includes(query)
      );
    });
  }, [q]);

  const run = runButton
    ? useRunToResultButton({
        taskId: runButton.taskId,
        resetKey: runButton.resetKey,
        getSubmittedProgram: runButton.getSubmittedProgram,
        userId: runButton.userId,
        navigateTo: runButton.navigateTo ?? "/result",
      } as any)
    : null;

  const autoNavigateOnComplete = runButton?.autoNavigateOnComplete ?? true;
  const navigateTo = runButton?.navigateTo ?? "/result";

  React.useEffect(() => {
    if (!runButton) return;
    if (!autoNavigateOnComplete) return;
    if (run?.phase !== "ready") return;
    router.push(navigateTo);
  }, [run?.phase, runButton, autoNavigateOnComplete, router, navigateTo]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded border px-3 py-2 text-sm"
        data-testid="cb-add-open"
        onClick={() => setOpen((v) => !v)}
      >
        {isBeginner ? "コマンドを追加" : "+ Add command"}
      </button>

      {runButton?.taskId ? (
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          data-testid="cb-run"
          onClick={() => run?.onClick()}
          disabled={!run || run.disabled}
          title={run?.title ?? "Run"}
        >
          {isBeginner ? "実行する" : (run?.label ?? "Run")}
        </button>
      ) : null}

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 w-[380px] rounded border bg-background p-2 shadow">
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder={
                  isBeginner
                    ? "さがす（例: ならべる / 合計 / 足す）"
                    : "Search (e.g. sort, grep, output)"
                }
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="cb-search"
              />
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm"
                onClick={() => setOpen(false)}
                data-testid="cb-close"
              >
                {isBeginner ? "とじる" : "Close"}
              </button>
            </div>

            <div className="mt-2 max-h-[280px] overflow-auto">
              {items.map((x) => (
                <button
                  key={x.type}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 rounded px-2 py-2 text-left hover:bg-muted"
                  data-testid={`cb-add-${x.type}`}
                  onClick={() => {
                    onAdd(x.type);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className={
                        isBeginner ? "text-sm font-medium" : "font-mono text-sm"
                      }
                    >
                      {isBeginner ? (x.beginnerLabel ?? x.label) : x.type}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {isBeginner
                        ? (x.beginnerDescription ?? x.unixHint)
                        : x.unixHint}
                    </div>

                    {isBeginner ? (
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground/80">
                        {x.type}
                      </div>
                    ) : null}
                  </div>

                  {!!x.params?.length && (
                    <span className="shrink-0 rounded border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {isBeginner ? "設定あり" : "params"}
                    </span>
                  )}
                </button>
              ))}

              {items.length === 0 && (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  {isBeginner ? "見つからないよ" : "No commands."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
