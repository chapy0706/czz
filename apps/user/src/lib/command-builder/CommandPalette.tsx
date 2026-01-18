// apps/user/src/lib/command-builder/CommandPalette.tsx
"use client";

import {
  COMMAND_CATALOG,
  type CommandCatalogItem,
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

function isFilterCommand(x: CommandCatalogItem): boolean {
  return x.type.startsWith("FILTER_");
}

function matchesQuery(
  x: CommandCatalogItem,
  q: string,
  isBeginner: boolean,
): boolean {
  if (!q) return true;
  const hay = isBeginner
    ? [x.ui.beginnerLabel, x.ui.beginnerExample ?? "", x.label, x.type]
    : [x.type, x.label, x.unixHint];
  return hay.some((h) => h.toLowerCase().includes(q));
}

function getRunState(run: unknown) {
  const r = run as any;

  const isVisible = Boolean(r?.isVisible ?? r?.visible ?? true);
  const isBusy = Boolean(
    r?.isBusy ?? r?.isRunning ?? r?.isLoading ?? r?.loading ?? false,
  );
  const disabled = Boolean(r?.disabled ?? isBusy);
  const label = typeof r?.label === "string" ? r.label : "Run";
  const onClick =
    typeof r?.onClick === "function" ? (r.onClick as () => void) : undefined;

  return { isVisible, isBusy, disabled, label, onClick };
}

export function CommandPalette(props: Props) {
  const { onAdd, runButton } = props;
  const router = useRouter();
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const baseCatalog = React.useMemo(
    () =>
      isBeginner
        ? COMMAND_CATALOG.filter((x) => !isFilterCommand(x))
        : COMMAND_CATALOG,
    [isBeginner],
  );

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return baseCatalog.filter((x) => matchesQuery(x, q, isBeginner));
  }, [baseCatalog, query, isBeginner]);

  // ✅ useRunToResultButton は「1引数（オブジェクト）」で呼ぶ
  const run = useRunToResultButton({
    taskId: runButton?.taskId ?? null,
    resetKey: runButton?.resetKey ?? "",
    getSubmittedProgram: runButton?.getSubmittedProgram ?? (() => null),
    userId: runButton?.userId,
    onNavigate: (to: string) => router.push(to),
    navigateTo: runButton?.navigateTo ?? "/result",
    autoNavigateOnComplete: runButton?.autoNavigateOnComplete ?? true,
  } as any);

  const runState = React.useMemo(() => getRunState(run), [run]);

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        data-testid="cb-add-command"
      >
        {isBeginner ? "+ コマンド追加" : "+ Add command"}
      </button>

      {runState.isVisible && runState.onClick ? (
        <button
          type="button"
          onClick={runState.onClick}
          disabled={runState.disabled}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          data-testid="cb-run"
        >
          {isBeginner
            ? runState.isBusy
              ? "実行中…"
              : "実行してみる"
            : runState.label}
        </button>
      ) : null}

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(560px,calc(100vw-2rem))] rounded-xl border bg-background p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder={
                isBeginner
                  ? "さがす（例: 足す / かける / 並べる / 合計）"
                  : "Search"
              }
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              {isBeginner ? "閉じる" : "Close"}
            </button>
          </div>

          <div className="mt-3 max-h-[360px] overflow-auto rounded-lg border">
            {items.map((x) => (
              <button
                key={x.type}
                type="button"
                onClick={() => {
                  onAdd(x.type);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted"
                data-testid={`cb-add-${x.type}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {isBeginner ? x.ui.beginnerLabel : x.type}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {isBeginner ? x.ui.beginnerExample : x.label}
                  </div>
                </div>

                {!isBeginner ? (
                  <div className="shrink-0 rounded-md bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground">
                    {x.unixHint}
                  </div>
                ) : null}
              </button>
            ))}

            {items.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                {isBeginner ? "見つからなかったよ。" : "No matches."}
              </div>
            ) : null}
          </div>

          {isBeginner ? (
            <div className="mt-2 text-xs text-muted-foreground">
              ※ 初心者モードでは FILTER（絞り込み）系は表示しないよ。
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
