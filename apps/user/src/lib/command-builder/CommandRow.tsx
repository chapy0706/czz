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

  // NEW: E2E 用 index（任意）
  index?: number;
};

function isCommandType(value: string): value is CommandType {
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
  const { command, isSelected, onSelect, onEdit, onDelete, dragHandleProps, index } = props;

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

  const type = typeRaw; // 表示用
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
          (e.currentTarget as HTMLDivElement).focus();
        }}
        onKeyDown={onKeyDown}
        data-testid={`cb-item-${type}`}
        // NEW: 既存 testid を壊さず、E2E で安定して掴むための index testid を追加
        {...(index != null ? { "data-testid-index": `cmd-row-${index}` } : {})}
        {...handlers}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm">{type}</div>
          <div className="truncate text-xs text-muted-foreground">{JSON.stringify(command.value)}</div>

          {/* UNIX コピペ用（実行可能テンプレ） */}
          {catalog?.unixHint ? (
            <div className="mt-2 space-y-2">
              <div
                className="rounded border bg-background px-2 py-1 font-mono text-xs text-muted-foreground"
                data-testid={`cb-unix-hint-${type}`}
                title="Copy-paste template (LPIC style)"
              >
                <span className="block overflow-auto whitespace-nowrap">{catalog.unixHint}</span>
              </div>

              {/* 分解表示（ステップ） */}
              {catalog.unixSteps && catalog.unixSteps.length > 0 ? (
                <div className="space-y-1" data-testid={`cb-unix-steps-${type}`}>
                  <div className="text-xs text-muted-foreground">
                    Pipeline steps（COL=1 / headerあり）:
                  </div>
                  <ol className="space-y-1">
                    {catalog.unixSteps.map((s, i) => (
                      <li
                        key={`${s.label}-${i}`}
                        className="flex items-start gap-2"
                        data-testid={`cb-unix-step-${type}-${i}`}
                      >
                        <span className="mt-[2px] inline-flex w-5 shrink-0 items-center justify-center rounded border px-1 font-mono text-[10px] text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[11px] text-muted-foreground">{s.label}</div>
                          <div className="font-mono text-xs text-muted-foreground">{s.cmd}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
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
