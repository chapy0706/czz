// apps/user/src/lib/command-builder/CommandList.tsx
"use client";

import { CommandRow } from "./CommandRow";

type Command = { id: string; value: any };

type Props = {
  layout?: "horizontal" | "vertical";
  commands: Command[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
};

export function CommandList(props: Props) {
  const {
    layout = "vertical",
    commands,
    selectedId,
    onSelect,
    onEdit,
    onRemove,
    onReorder,
  } = props;

  if (commands.length === 0) {
    return <div className="text-sm text-muted-foreground">まだコマンドがないよ</div>;
  }

  // 横並び：見切れ対策で “横スクロール” を採用
  if (layout === "horizontal") {
    return (
      <div className="w-full overflow-x-auto" data-testid="runner-commands-scroll">
        <div className="flex min-w-max items-stretch gap-2 pr-2">
          {commands.map((cmd, i) => (
            <CommandRow
              key={cmd.id}
              command={cmd}
              index={i}
              isSelected={cmd.id === selectedId}
              onSelect={() => onSelect(cmd.id)}
              onEdit={() => onEdit(cmd.id)}
              onRemove={() => onRemove(cmd.id)}
              onReorder={onReorder}
              variant="chip"
            />
          ))}
        </div>
      </div>
    );
  }

  // 縦並び
  return (
    <div className="grid gap-2" data-testid="runner-commands-list">
      {commands.map((cmd, i) => (
        <CommandRow
          key={cmd.id}
          command={cmd}
          index={i}
          isSelected={cmd.id === selectedId}
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
