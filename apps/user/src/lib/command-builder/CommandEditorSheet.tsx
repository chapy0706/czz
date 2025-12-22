// apps/user/src/components/command-builder/CommandEditorSheet.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import * as React from "react";

type Props = {
  selected: CommandDraft | null;
  onClose: () => void;
  onSave: (id: string, next: unknown) => void;
};

function safeParse(text: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, message: msg };
  }
}

export function CommandEditorSheet(props: Props) {
  const { selected, onClose, onSave } = props;
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selected) return;
    setText(JSON.stringify(selected.value, null, 2));
    setError(null);
  }, [selected?.id]);

  if (!selected) return null;

  const parsed = safeParse(text);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-lg border bg-background p-4 shadow">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-sm">Edit command JSON</div>
          <button type="button" className="rounded border px-2 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          DSL の schema に合わせて JSON を編集できます。最低限 <code>{"{ \"type\": \"...\" }"}</code>{" "}
          を含めてください。
        </p>

        <textarea
          className="mt-3 min-h-[240px] w-full rounded border px-3 py-2 font-mono text-xs"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          data-testid="cb-editor"
        />

        {"message" in parsed && (
        <div className="mt-2 text-sm text-destructive">JSON error: {parsed.message}</div>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            disabled={!parsed.ok}
            onClick={() => {
              if (!parsed.ok) return;
              onSave(selected.id, parsed.value);
              onClose();
            }}
            data-testid="cb-save"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
