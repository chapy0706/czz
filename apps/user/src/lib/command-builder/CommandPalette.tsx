// apps/user/src/components/command-builder/CommandPalette.tsx
"use client";

import { COMMAND_CATALOG, type CommandType } from "@/lib/command-builder/commandCatalog";
import * as React from "react";

type Props = {
  onAdd: (type: CommandType) => void;
};

export function CommandPalette(props: Props) {
  const { onAdd } = props;
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
              <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => setOpen(false)}>
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
                  {x.needsParams && (
                    <span className="shrink-0 rounded border px-2 py-0.5 text-[11px] text-muted-foreground">
                      params
                    </span>
                  )}
                </button>
              ))}
              {items.length === 0 && (
                <div className="px-2 py-4 text-sm text-muted-foreground">No commands.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
