// apps/user/src/components/command-builder/CommandPalette.tsx
"use client";

import { COMMAND_CATALOG, type CommandType } from "@/lib/command-builder/commandCatalog";
import { useRunToResultButton } from "@/lib/terminal/useRunToResultButton";
import { useRouter } from "next/navigation";
import * as React from "react";

type RunButtonConfig = {
  /**
   * /tasks/[taskId] の taskId。存在しない場合は Run ボタンは表示しない。
   */
  taskId: string | null;

  /**
   * 実行対象が変わったらボタン状態を idle に戻すためのキー。
   * 例: JSON.stringify(commands.map(c => c.value))
   */
  resetKey: string;

  /**
   * submittedProgram を返す関数（例: useCommandBuilderStore.getState().serializeProgram()）
   */
  getSubmittedProgram: () => unknown;

  userId?: string;

  /**
   * 既定: "/result"
   */
  navigateTo?: string;

  /**
   * true の場合、判定完了後に自動遷移する（A案）。
   * 既定: true
   *
   * NOTE:
   * useRunToResultButton 側に autoNavigateOnComplete が無い版でも動くよう、
   * ここでは phase === "ready" を監視して遷移する。
   */
  autoNavigateOnComplete?: boolean;
};

type Props = {
  onAdd: (type: CommandType) => void;

  /**
   * + Add command の横に A案対応 Run（実行→結果へ）を置くための設定。
   * 未指定の場合、Run ボタン自体を出さない（ノイズ回避）。
   */
  runButton?: RunButtonConfig;
};

export function CommandPalette(props: Props) {
  const { onAdd, runButton } = props;

  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const items = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return COMMAND_CATALOG;

    return COMMAND_CATALOG.filter((x) => {
      return (
        x.type.toLowerCase().includes(query) ||
        x.label.toLowerCase().includes(query) ||
        x.unixHint.toLowerCase().includes(query)
      );
    });
  }, [q]);

  // Run ボタンは「設定がある時だけ」表示（非活性ボタンのノイズを出さない）
  const run = runButton
    ? useRunToResultButton({
        taskId: runButton.taskId,
        resetKey: runButton.resetKey,
        getSubmittedProgram: runButton.getSubmittedProgram,
        userId: runButton.userId,
        navigateTo: runButton.navigateTo ?? "/result",
      } as any) // 旧版 hook との互換を保つため any
    : null;

  const autoNavigateOnComplete = runButton?.autoNavigateOnComplete ?? true;
  const navigateTo = runButton?.navigateTo ?? "/result";

  // A案: 判定が終わったら自動で結果へ（hook 側が未対応でもここで担保）
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
        + Add command
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
          {run?.label ?? "実行"}
        </button>
      ) : null}

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 w-[360px] rounded border bg-background p-2 shadow">
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Search (e.g. sort, grep, output)"
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
                Close
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
                    <div className="font-mono text-sm">{x.type}</div>
                    <div className="text-xs text-muted-foreground">{x.unixHint}</div>
                  </div>
                  {!!x.params?.length && (
                    <span className="shrink-0 rounded border px-2 py-0.5 text-[11px] text-muted-foreground">
                      params
                    </span>
                  )}
                </button>
              ))}
              {items.length === 0 && <div className="px-2 py-4 text-sm text-muted-foreground">No commands.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
