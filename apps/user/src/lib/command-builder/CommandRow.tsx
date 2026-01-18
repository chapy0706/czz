// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import * as React from "react";

type Props = {
  /**
   * CommandList 側の型に依存しないため、必要最小限だけ要求する。
   * （構造的部分型なので、上位互換の型でも渡せる）
   */
  command: { id: string; value: any };

  index: number;
  isSelected: boolean;

  onSelect: () => void;

  /**
   * クリック/スワイプで編集シートを開く用途
   */
  onEdit: () => void;

  onRemove: () => void;

  /**
   * 既存の並び替えAPI（CommandList から渡される）
   * このコンポーネントでは、必要なら drag&drop 実装に使う。
   */
  onReorder: (from: number, to: number) => void;

  /**
   * "row" | "chip" を想定しているが、呼び出し元が string を渡しても壊れないようにする。
   */
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

    // ちょい強めにして誤爆を減らす
    if (dx > 70) onEdit();
    if (dx < -70) onRemove();
  }

  const isChip = variant === "chip";

  const base = isChip
    ? "relative flex items-center gap-2 rounded border px-3 py-2 text-sm"
    : "relative flex items-center justify-between gap-2 rounded border px-3 py-2";

  // 選択中：背景を明るく（= 目立つが文字は増やさない）
  const selected =
    "bg-accent/60 ring-2 ring-foreground/10 border-foreground/10";
  const normal = "bg-background";

  return (
    <div
      className={`${base} ${isSelected ? selected : normal}`}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      // E2E互換（重要）
      data-testid-index={`cmd-row-${index}`}
      data-testid={`cb-item-${type}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      {/* 左アクセント（選択時のみ） */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l ${
          isSelected ? "bg-foreground/30" : "bg-transparent"
        }`}
        aria-hidden="true"
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm">{type}</div>
        </div>

        {!isChip ? (
          <div className="text-xs text-muted-foreground">
            Swipe: → edit / ← delete
          </div>
        ) : null}
      </div>

      {/* UXはスワイプ、E2E/確実操作はボタン */}
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
