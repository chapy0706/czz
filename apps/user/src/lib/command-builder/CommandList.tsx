// apps/user/src/lib/components/command-builder/CommandList.tsx
"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import { CommandRow } from "@/lib/command-builder/CommandRow";

type Props = {
  commands: CommandDraft[];
  selectedId: string | null;

  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

function SortableRow(props: {
  cmd: CommandDraft;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { cmd, selected, onSelect, onEdit, onRemove } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cmd.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  // dnd-kit のハンドルにだけ listeners/attributes を付ける
  const dragHandleProps: React.HTMLAttributes<HTMLSpanElement> = {
    ...attributes,
    ...listeners,
    onClick: (e) => {
      // クリックで選択もしたいので止めない（ただし他の onClick があるなら優先）
      e.stopPropagation();
      onSelect();
    },
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CommandRow
        command={cmd}
        isSelected={selected}
        onSelect={() => onSelect()}
        onEdit={() => onEdit()}
        onDelete={() => onRemove()}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
}

export function CommandList(props: Props) {
  const { commands, selectedId, onSelect, onEdit, onRemove, onReorder } = props;

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
              onEdit={() => onEdit(cmd.id)}
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
