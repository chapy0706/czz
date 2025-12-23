// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import { useSwipeActions } from "@/lib/command-builder/useSwipeActions";
import * as React from "react";

type Props = {
  command: CommandDraft;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;

  // dnd-kit 用（SortableRow から渡す）
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
};

export function CommandRow(props: Props) {
  const { command, isSelected, onSelect, onEdit, onDelete, dragHandleProps } = props;

  const ignoreIfDndHandle = React.useCallback((t: EventTarget | null) => {
    const el = t instanceof Element ? t : null;
    return !!el?.closest?.('[data-dnd-handle="1"]');
  }, []);

  const { dx, isSwiping, handlers } = useSwipeActions({
    thresholdPx: 56,
    onSwipeLeft: () => onDelete(command.id),
    onSwipeRight: () => onEdit(command.id),
    shouldIgnorePointerDown: ignoreIfDndHandle,
  });

  const style: React.CSSProperties = {
    transform: `translateX(${dx}px)`,
    transition: isSwiping ? "none" : "transform 120ms ease-out",
    touchAction: "pan-y",
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isSelected) return;

    if (e.key === "Enter" || e.key.toLowerCase() === "e") {
      e.preventDefault();
      onEdit(command.id);
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      onDelete(command.id);
      return;
    }
  };

  const type =
    typeof command.value === "object" && command.value && "type" in (command.value as any)
      ? String((command.value as any).type)
      : "UNKNOWN";

  return (
    <div className="relative">
      {/* 背景（スワイプで見える） */}
      <div className="absolute inset-0 flex items-center justify-between rounded border bg-muted px-3 text-xs text-muted-foreground">
        {/* 右スワイプ(→)で左背景が見える = Edit を左に置く */}
        <span>Edit</span>
        {/* 左スワイプ(←)で右背景が見える = Delete を右に置く */}
        <span>Delete</span>
      </div>

      {/* 前面 */}
      <div
        role="button"
        tabIndex={0}
        aria-selected={isSelected}
        className={[
          "relative flex items-center justify-between gap-2 rounded border bg-background px-3 py-2",
          isSelected ? "ring-2 ring-offset-2" : "hover:bg-accent",
        ].join(" ")}
        style={style}
        onClick={(e) => {
          onSelect(command.id);
          // キーボード操作（E / Delete）を確実にこの行に当てる
          (e.currentTarget as HTMLDivElement).focus();
        }}
        onKeyDown={onKeyDown}
        data-testid={`cb-item-${type}`}
        {...handlers}
      >
        <div className="min-w-0">
          <div className="truncate font-mono text-sm">{type}</div>
          <div className="truncate text-xs text-muted-foreground">{JSON.stringify(command.value)}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(command.id);
            }}
            data-testid={`cb-edit-${command.id}`}
            title="Edit (E/Enter)"
          >
            Edit
          </button>

          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(command.id);
            }}
            data-testid="cb-remove"
            title="Delete (Del/Backspace)"
          >
            Remove
          </button>

          {/* dnd-kit のハンドル（ここだけドラッグ） */}
          <span
            className="ml-1 cursor-grab select-none rounded border px-2 py-1 font-mono text-xs text-muted-foreground"
            data-dnd-handle="1"
            title="Drag to reorder"
            {...dragHandleProps}
          >
            ::
          </span>
        </div>
      </div>
    </div>
  );
}
