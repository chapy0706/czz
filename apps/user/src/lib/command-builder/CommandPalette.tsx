// apps/user/src/lib/command-builder/CommandPalette.tsx
"use client";

import * as React from "react";

import {
  COMMAND_CATALOG,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";

type UiMode = "beginner" | "normal";

type Props = {
  onAdd: (type: CommandType) => void;

  runButton: {
    taskId: string | null;
    userId?: string;
    resetKey: string;
    getSubmittedProgram: () => unknown;
    navigateTo: string;
    autoNavigateOnComplete: boolean;
  };

  /** 既定: "normal" */
  uiMode?: UiMode;
};

export function CommandPalette(props: Props) {
  const { onAdd, uiMode = "normal" } = props;

  // INPUT/OUTPUT は「端のI/O選択」に寄せるのでパレットから外す
  const items = React.useMemo(
    () =>
      COMMAND_CATALOG.filter((x) => x.type !== "INPUT" && x.type !== "OUTPUT"),
    [],
  );

  const sorted = React.useMemo(() => {
    const key = uiMode === "beginner" ? "beginnerOrder" : "normalOrder";
    return [...items].sort(
      (a, b) => (a.ui?.[key] ?? 9999) - (b.ui?.[key] ?? 9999),
    );
  }, [items, uiMode]);

  return (
    <div className="rounded border p-3">
      <div className="mb-2 text-xs font-semibold opacity-70">Command</div>

      <div className="flex flex-wrap gap-2">
        {sorted.map((item) => (
          <button
            key={item.type}
            type="button"
            className="rounded border px-3 py-2 text-sm hover:bg-muted"
            onClick={() => onAdd(item.type)}
            title={item.unixHint ?? item.label}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
