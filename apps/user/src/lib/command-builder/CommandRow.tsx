// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import {
  getCatalogItem,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import * as React from "react";

type Props = {
  command: { id: string; value: any };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onReorder: (from: number, to: number) => void;
  variant?: string;
};

export function CommandRow(props: Props) {
  const {
    command,
    index,
    isSelected,
    onSelect,
    onEdit,
    onRemove,
    variant = "row",
  } = props;

  const isBeginner = useUiModeStore((s) => s.mode === "beginner");

  const type = String(command.value?.type ?? "UNKNOWN");
  const cat = getCatalogItem(type as CommandType);

  const title = isBeginner
    ? (cat?.ui.beginnerLabel ?? cat?.label ?? type)
    : type;
  const sub = isBeginner
    ? (cat?.ui.beginnerExample ?? "")
    : "Swipe: → edit / ← delete";

  const startXRef = React.useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = null;

    if (dx > 70) onEdit();
    if (dx < -70) onRemove();
  }

  const isChip = variant === "chip";

  const base = isChip
    ? "relative flex items-center gap-2 rounded border px-3 py-2 text-sm"
    : "relative flex items-center justify-between gap-2 rounded border px-3 py-2";

  const selected =
    "bg-accent/60 ring-2 ring-foreground/10 border-foreground/10";
  const normal = "bg-background";

  return (
    <div
      className={`${base} ${isSelected ? selected : normal}`}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      data-testid-index={`cmd-row-${index}`}
      data-testid={`cb-item-${type}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l ${
          isSelected ? "bg-foreground/30" : "bg-transparent"
        }`}
        aria-hidden="true"
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={
              isBeginner ? "text-sm font-semibold" : "font-mono text-sm"
            }
          >
            {title}
          </div>
        </div>

        {!isChip && sub ? (
          <div className="text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          data-testid={`cmd-edit-${index}`}
          aria-label="edit command"
          title="Edit"
        >
          {isBeginner ? "編集" : "Edit"}
        </button>

        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          data-testid={`cmd-del-${index}`}
          aria-label="delete command"
          title="Delete"
        >
          {isBeginner ? "削除" : "Del"}
        </button>
      </div>
    </div>
  );
}
