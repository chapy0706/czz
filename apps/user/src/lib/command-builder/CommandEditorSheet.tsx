// apps/user/src/lib/command-builder/CommandEditorSheet.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import {
  getCatalogItem,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import * as React from "react";

type Props = {
  selected: CommandDraft | null;
  onClose: () => void;
  onSave: (nextValue: unknown) => void;
};

type Mode = "basic" | "advanced";

function extractType(value: unknown): string {
  if (!value || typeof value !== "object") return "UNKNOWN";
  const v = value as { type?: unknown };
  return typeof v.type === "string" ? v.type : "UNKNOWN";
}

function asObject(value: unknown): Record<string, unknown> {
  // ✅ spread エラー対策：object 以外は空オブジェクトに落とす
  if (value && typeof value === "object")
    return value as Record<string, unknown>;
  return {};
}

export function CommandEditorSheet(props: Props) {
  const { selected, onClose, onSave } = props;
  const isBeginner = useUiModeStore((s) => s.mode === "beginner");

  const [mode, setMode] = React.useState<Mode>("basic");
  const [advancedJson, setAdvancedJson] = React.useState<string>("");
  const [basicValues, setBasicValues] = React.useState<Record<string, unknown>>(
    {},
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selected) return;

    const typeRaw = extractType(selected.value);
    const cat = getCatalogItem(typeRaw as CommandType);

    setMode(isBeginner ? "basic" : "basic");
    setAdvancedJson(JSON.stringify(selected.value ?? {}, null, 2));

    const init: Record<string, unknown> = {};
    const obj = asObject(selected.value);
    for (const p of cat?.params ?? []) {
      init[p.key] = (obj as any)[p.key] ?? "";
    }
    setBasicValues(init);
    setError(null);
  }, [selected, isBeginner]);

  if (!selected) return null;

  const typeRaw = extractType(selected.value);
  const cat = getCatalogItem(typeRaw as CommandType);

  const title = isBeginner ? "コマンドの設定" : "Command Editor";
  const label = isBeginner
    ? (cat?.ui.beginnerLabel ?? cat?.label ?? typeRaw)
    : typeRaw;
  const help = isBeginner
    ? (cat?.ui.beginnerExample ?? "")
    : (cat?.unixHint ?? "");

  const canShowAdvanced = !isBeginner;

  function onSubmitBasic() {
    setError(null);

    const base = asObject(selected.value);
    const next: Record<string, unknown> = { ...base, type: typeRaw };

    for (const p of cat?.params ?? []) {
      const v = basicValues[p.key];

      if (p.required && (v === "" || v === undefined || v === null)) {
        setError(
          isBeginner
            ? `「${p.beginnerLabel ?? p.label}」は必須だよ。`
            : `${p.key} is required`,
        );
        return;
      }
      next[p.key] = v;
    }

    onSave(next);
    onClose();
  }

  function onSubmitAdvanced() {
    setError(null);
    try {
      const parsed = JSON.parse(advancedJson);
      if (!parsed || typeof parsed !== "object") {
        setError("JSON must be an object");
        return;
      }
      (parsed as any).type = typeRaw;
      onSave(parsed);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Invalid JSON");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2">
      <div className="w-full max-w-xl rounded-2xl border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div
              className={
                isBeginner ? "text-lg font-semibold" : "font-mono text-lg"
              }
            >
              {label}
            </div>
            {help ? (
              <div className="mt-1 text-xs text-muted-foreground">{help}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            {isBeginner ? "閉じる" : "Close"}
          </button>
        </div>

        {canShowAdvanced ? (
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="text-sm text-muted-foreground">Mode</div>
            <div className="flex gap-2">
              <button
                type="button"
                className={[
                  "rounded-lg border px-3 py-1 text-sm",
                  mode === "basic" ? "bg-muted" : "hover:bg-muted/50",
                ].join(" ")}
                onClick={() => setMode("basic")}
              >
                Basic
              </button>
              <button
                type="button"
                className={[
                  "rounded-lg border px-3 py-1 text-sm",
                  mode === "advanced" ? "bg-muted" : "hover:bg-muted/50",
                ].join(" ")}
                onClick={() => setMode("advanced")}
              >
                Advanced(JSON)
              </button>
            </div>
          </div>
        ) : null}

        <div className="p-4">
          {error ? (
            <div className="mb-3 rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          {mode === "advanced" && canShowAdvanced ? (
            <div className="space-y-2">
              <textarea
                value={advancedJson}
                onChange={(e) => setAdvancedJson(e.target.value)}
                className="h-56 w-full rounded-xl border p-3 font-mono text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSubmitAdvanced}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(cat?.params?.length ?? 0) === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {isBeginner
                    ? "このコマンドは設定いらないよ。"
                    : "No parameters."}
                </div>
              ) : null}

              {cat?.params?.map((p) => {
                const label = isBeginner
                  ? (p.beginnerLabel ?? p.label)
                  : p.label;
                const placeholder = isBeginner
                  ? (p.beginnerPlaceholder ?? "")
                  : "";
                const v = basicValues[p.key] ?? "";

                return (
                  <div key={p.key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{label}</div>
                      {p.required ? (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {isBeginner ? "必須" : "required"}
                        </span>
                      ) : null}
                    </div>
                    <input
                      value={String(v)}
                      onChange={(e) =>
                        setBasicValues((prev) => ({
                          ...prev,
                          [p.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      placeholder={placeholder}
                    />
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {isBeginner ? "もどる" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={onSubmitBasic}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {isBeginner ? "OK" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
