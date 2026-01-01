// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import * as React from "react";

export function CommandRow(props: {
  command: { id: string; value: any };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onReorder: (from: number, to: number) => void;
  variant?: "row" | "chip";
}) {
  const { command, index, isSelected, onSelect, onEdit, onRemove, variant = "row" } = props;

  const type = String(command.value?.type ?? "UNKNOWN");

  // Swipe（UX用）：左右にドラッグしたら Edit/Delete
  const startXRef = React.useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = null;

    if (dx > 60) onEdit();
    if (dx < -60) onRemove();
  }

  const base =
    variant === "chip"
      ? "flex items-center gap-2 rounded border px-3 py-2 text-sm"
      : "flex items-center justify-between gap-2 rounded border px-3 py-2";

  const active = isSelected ? "bg-muted/30" : "bg-background";

  return (
    <div
      className={`${base} ${active}`}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      // 既存E2E互換
      data-testid-index={`cmd-row-${index}`}
      data-testid={`cb-item-${type}`}
    >
      <div className="min-w-0">
        <div className="font-mono text-sm">{type}</div>
        {variant === "row" ? (
          <div className="text-xs text-muted-foreground">Swipe: → edit / ← delete</div>
        ) : null}
      </div>

      {/* ★ chip でも Edit/Del を出す（E2Eの安定性のため） */}
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
          Edit
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
          Del
        </button>
      </div>
    </div>
  );
}
