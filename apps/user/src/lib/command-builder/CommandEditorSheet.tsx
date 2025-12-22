// apps/user/src/components/command-builder/CommandEditorSheet.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import { getCatalogItem, type CommandType } from "@/lib/command-builder/commandCatalog";
import * as React from "react";

type Props = {
  selected: CommandDraft | null;
  onClose: () => void;
  onSave: (id: string, next: unknown) => void;
};

type ParseOk = { ok: true; value: unknown };
type ParseNg = { ok: false; message: string };
type ParseResult = ParseOk | ParseNg;

function safeParse(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, message: msg };
  }
}

function getCommandType(value: unknown): CommandType | null {
  if (!value || typeof value !== "object") return null;
  const any = value as { type?: unknown };
  return typeof any.type === "string" ? (any.type as CommandType) : null;
}

function getParamValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  const any = value as Record<string, unknown>;
  return any[key];
}

export function CommandEditorSheet(props: Props) {
  const { selected, onClose, onSave } = props;

  const [mode, setMode] = React.useState<"basic" | "advanced">("basic");
  const [text, setText] = React.useState("");
  const [basicValue, setBasicValue] = React.useState<string>("");
  const [basicError, setBasicError] = React.useState<string | null>(null);

  const cmdType = React.useMemo(
    () => (selected ? getCommandType(selected.value) : null),
    [selected?.id],
  );
  const catalog = React.useMemo(
    () => (cmdType ? getCatalogItem(cmdType) : undefined),
    [cmdType],
  );
  const paramSpec = (catalog?.params ?? [])[0]; // まずは 1パラメータ前提（value）

  React.useEffect(() => {
    if (!selected) return;

    setText(JSON.stringify(selected.value, null, 2));
    setMode("basic");
    setBasicError(null);

    if (paramSpec) {
      const v = getParamValue(selected.value, paramSpec.key);
      setBasicValue(v == null ? "" : String(v));
    } else {
      setBasicValue("");
    }
    // paramSpec は memo 由来なので deps には入れない（必要なら後で分割する）
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className="min-w-0">
            <div className="font-mono text-sm">Edit command</div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {cmdType ?? "UNKNOWN"} {catalog?.unixHint ? `— ${catalog.unixHint}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={() => setMode((m) => (m === "basic" ? "advanced" : "basic"))}
              data-testid="cb-toggle-advanced"
            >
              {mode === "basic" ? "Advanced(JSON)" : "Basic(Form)"}
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {mode === "basic" ? (
          <div className="mt-3 space-y-3">
            {!paramSpec ? (
              <div className="rounded border p-3 text-sm text-muted-foreground">
                このコマンドは params がありません。並び替えて Run できます。
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium">{paramSpec.label}</label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={basicValue}
                  onChange={(e) => {
                    setBasicValue(e.target.value);
                    setBasicError(null);
                  }}
                  placeholder={String(paramSpec.defaultValue)}
                  inputMode={paramSpec.kind === "number" ? "numeric" : "text"}
                  data-testid="cb-param-value"
                />
                {basicError ? (
                  <div className="text-sm text-destructive">{basicError}</div>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  ※ 生成される JSON は右側（Generated JSON）で常に確認できます。困ったら Advanced(JSON) に切り替え。
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              DSL の schema に合わせて JSON を編集できます。最低限{" "}
              <code>{`{ "type": "..." }`}</code> を含めてください。
            </p>

            <textarea
              className="mt-3 min-h-[240px] w-full rounded border px-3 py-2 font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              data-testid="cb-editor"
            />

            {"message" in parsed && (
              <div className="mt-2 text-sm text-destructive">
                JSON error: {parsed.message}
              </div>
            )}
          </>
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
            disabled={mode === "advanced" ? !parsed.ok : false}
            onClick={() => {
              if (mode === "advanced") {
                if (!parsed.ok) return;
                onSave(selected.id, parsed.value);
                onClose();
                return;
              }

              // Basic(Form) Save
              if (!paramSpec) {
                onClose();
                return;
              }

              const raw = basicValue.trim();
              if (paramSpec.required && raw.length === 0) {
                setBasicError(`${paramSpec.label} is required`);
                return;
              }

              let nextParam: unknown = raw;
              if (paramSpec.kind === "number") {
                const n = Number(raw);
                if (!Number.isFinite(n)) {
                  setBasicError(`${paramSpec.label} must be a number`);
                  return;
                }
                nextParam = n;
              }

              const base =
                selected.value && typeof selected.value === "object"
                  ? ({ ...(selected.value as Record<string, unknown>) } as Record<
                      string,
                      unknown
                    >)
                  : ({ type: cmdType ?? "UNKNOWN" } as Record<string, unknown>);

              base.type = cmdType ?? base.type;
              base[paramSpec.key] = nextParam;

              onSave(selected.id, base);
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
