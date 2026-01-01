// apps/user/src/lib/command-builder/CommandList.tsx
"use client";

import { CommandRow } from "./CommandRow";

type Layout = "vertical" | "horizontal";

export type CommandListItem = {
  id: string;
  value: any;
};

export function CommandList(props: {
  commands: CommandListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  layout?: Layout;
}) {
  const {
    commands,
    selectedId,
    onSelect,
    onEdit,
    onRemove,
    onReorder,
    layout = "vertical",
  } = props;

  if (commands.length === 0) {
    return (
      <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">
        まだコマンドがない。右上の追加から入れる。
      </div>
    );
  }

  if (layout === "horizontal") {
    return (
      <div
        className="flex w-full min-w-0 gap-2 overflow-x-auto rounded border bg-background p-2"
        data-testid="cmd-list-horizontal"
      >
        {commands.map((cmd, idx) => (
          <div key={cmd.id} className="shrink-0">
            <CommandRow
              command={cmd}
              index={idx}
              isSelected={selectedId === cmd.id}
              onSelect={() => onSelect(cmd.id)}
              onEdit={() => onEdit(cmd.id)}
              onRemove={() => onRemove(cmd.id)}
              onReorder={onReorder}
              variant="chip"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="cmd-list-vertical">
      {commands.map((cmd, idx) => (
        <CommandRow
          key={cmd.id}
          command={cmd}
          index={idx}
          isSelected={selectedId === cmd.id}
          onSelect={() => onSelect(cmd.id)}
          onEdit={() => onEdit(cmd.id)}
          onRemove={() => onRemove(cmd.id)}
          onReorder={onReorder}
          variant="row"
        />
      ))}
    </div>
  );
}
