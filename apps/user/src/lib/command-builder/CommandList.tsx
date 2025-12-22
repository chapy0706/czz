// apps/user/src/components/command-builder/CommandList.tsx
"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";

type Props = {
  commands: CommandDraft[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

function getType(value: unknown): string {
  if (!value || typeof value !== "object") return "UNKNOWN";
  const any = value as { type?: unknown };
  return typeof any.type === "string" ? any.type : "UNKNOWN";
}

function SortableRow(props: {
  cmd: CommandDraft;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { cmd, selected, onSelect, onRemove } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cmd.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const type = getType(cmd.value);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center justify-between gap-2 rounded border px-2 py-2",
        selected ? "border-foreground" : "",
      ].join(" ")}
      data-testid={`cb-item-${type}`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-2 text-left"
        onClick={onSelect}
      >
        <span
          className="cursor-grab select-none rounded border px-2 py-1 font-mono text-xs"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ::
        </span>
        <div className="min-w-0">
          <div className="truncate font-mono text-sm">{type}</div>
          <div className="truncate text-xs text-muted-foreground">
            {JSON.stringify(cmd.value)}
          </div>
        </div>
      </button>

      <button
        type="button"
        className="rounded border px-2 py-1 text-xs"
        onClick={onRemove}
        data-testid="cb-remove"
      >
        Remove
      </button>
    </div>
  );
}

export function CommandList(props: Props) {
  const { commands, selectedId, onSelect, onRemove, onReorder } = props;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => {
        const { active, over } = e;
        if (!over) return;
        if (active.id === over.id) return;

        const fromIndex = commands.findIndex((c) => c.id === active.id);
        const toIndex = commands.findIndex((c) => c.id === over.id);
        if (fromIndex < 0 || toIndex < 0) return;

        // 見た目は arrayMove、実際の更新は呼び出し元で
        onReorder(fromIndex, toIndex);
      }}
    >
      <SortableContext items={commands.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2" data-testid="cb-list">
          {commands.map((cmd) => (
            <SortableRow
              key={cmd.id}
              cmd={cmd}
              selected={cmd.id === selectedId}
              onSelect={() => onSelect(cmd.id)}
              onRemove={() => onRemove(cmd.id)}
            />
          ))}
          {commands.length === 0 && (
            <div className="rounded border px-3 py-6 text-sm text-muted-foreground">
              No commands yet. Add one to start.
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
