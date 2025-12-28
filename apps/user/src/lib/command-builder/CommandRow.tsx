// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import { getCatalogItem, type CommandType } from "@/lib/command-builder/commandCatalog";
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

function isCommandType(value: string): value is CommandType {
  // union を runtime で守る（表示だけに使うので軽く）
  return (
    value === "FILTER_EQUALS" ||
    value === "FILTER_NOT_EQUALS" ||
    value === "FILTER_GT" ||
    value === "MAP_ADD" ||
    value === "MAP_MULTIPLY" ||
    value === "SORT_ASC" ||
    value === "SORT_DESC" ||
    value === "OUTPUT_FIRST" ||
    value === "OUTPUT_LAST" ||
    value === "OUTPUT_SUM"
  );
}

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

  const typeRaw =
    typeof command.value === "object" && command.value && "type" in (command.value as any)
      ? String((command.value as any).type)
      : "UNKNOWN";

  const type = typeRaw; // 表示用（data-testid に使う）
  const catalog = isCommandType(typeRaw) ? getCatalogItem(typeRaw) : undefined;

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
          "relative flex items-start justify-between gap-2 rounded border bg-background px-3 py-2",
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
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm">{type}</div>
          <div className="truncate text-xs text-muted-foreground">{JSON.stringify(command.value)}</div>

          {/* 追加: UNIX 分解表示（stdin→stdout） */}
          {catalog?.unixHint ? (
            <div className="mt-2 space-y-1">
              <div
                className="inline-flex max-w-full items-center rounded border bg-background px-2 py-1 font-mono text-xs text-muted-foreground"
                data-testid={`cb-unix-hint-${type}`}
                title="UNIX view (stdin → stdout)"
              >
                <span className="truncate">{catalog.unixHint}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                UNIX view: <span className="font-mono">stdin → stdout</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
