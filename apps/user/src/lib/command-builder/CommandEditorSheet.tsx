// apps/user/src/lib/command-builder/CommandEditorSheet.tsx
"use client";

import type { CommandDraft } from "@/lib/command-builder/commandBuilderStore";
import {
  getCatalogItem,
  getCommandDisplayLabel,
  getCommandDisplaySubLabel,
  type CommandType,
} from "@/lib/command-builder/commandCatalog";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import * as React from "react";

type Props = {
  selected: CommandDraft | null;
  onClose: () => void;
  onSave: (id: string, next: unknown) => void;
};

export function CommandEditorSheet(props: Props) {
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  const selected = props.selected;

  const [localJson, setLocalJson] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selected) {
      setLocalJson("");
      setError(null);
      return;
    }
    setLocalJson(JSON.stringify(selected.value, null, 2));
    setError(null);
  }, [selected?.id]);

  if (!selected) return null;

  const cmdType = ((selected.value as any)?.type ?? null) as CommandType | null;
  const item = cmdType ? getCatalogItem(cmdType) : undefined;

  // value パラメータ（現状 1個前提のUI）
  const paramSpec = item?.params?.[0] ?? null;
  const paramKey = paramSpec?.key ?? null;

  const parsed = (() => {
    try {
      const v = JSON.parse(localJson);
      return { ok: true as const, value: v };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      return { ok: false as const, message: msg };
    }
  })();

  const displayTitle = cmdType
    ? getCommandDisplayLabel(cmdType, isBeginner ? "beginner" : "default")
    : isBeginner
      ? "コマンド"
      : "Command";
  const displaySub = cmdType
    ? getCommandDisplaySubLabel(cmdType, isBeginner ? "beginner" : "default")
    : "";

  const currentParamValue = paramKey
    ? parsed.ok
      ? (parsed.value as any)?.[paramKey]
      : (selected.value as any)?.[paramKey]
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3">
      <div className="w-full max-w-[560px] rounded-2xl border bg-background p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold">{displayTitle}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {displaySub}
            </div>
            {cmdType ? (
              <div className="mt-1 font-mono text-[11px] text-muted-foreground/80">
                {cmdType}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="rounded border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={props.onClose}
            data-testid="cb-close"
          >
            {isBeginner ? "とじる" : "Close"}
          </button>
        </div>

        {paramSpec && cmdType ? (
          <div className="mt-4 rounded-xl border bg-card/30 p-3">
            <div className="text-sm font-medium">
              {isBeginner
                ? (paramSpec.beginnerLabel ?? "数字")
                : paramSpec.label}
            </div>
            {isBeginner && paramSpec.beginnerHelp ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {paramSpec.beginnerHelp}
              </div>
            ) : null}

            <div className="mt-2">
              <input
                className="w-full rounded border bg-background px-3 py-2 text-sm"
                value={
                  currentParamValue === undefined || currentParamValue === null
                    ? ""
                    : String(currentParamValue)
                }
                placeholder={
                  isBeginner
                    ? (paramSpec.beginnerPlaceholder ?? "例: 3")
                    : "value"
                }
                onChange={(e) => {
                  setError(null);
                  const raw = e.target.value;

                  // selected.value を土台にして編集（Storeの形を変えない）
                  const base = { ...(selected.value as any) };
                  base.type = cmdType;

                  if (paramSpec.kind === "number") {
                    const t = raw.trim();
                    if (!t) {
                      base[paramSpec.key] = raw; // 入力途中も保持
                      setLocalJson(JSON.stringify(base, null, 2));
                      setError(
                        isBeginner ? "数字を入れてね" : "number required",
                      );
                      return;
                    }
                    const n = Number(t);
                    if (Number.isNaN(n)) {
                      base[paramSpec.key] = raw;
                      setLocalJson(JSON.stringify(base, null, 2));
                      setError(
                        isBeginner ? "数字じゃないみたい" : "invalid number",
                      );
                      return;
                    }
                    base[paramSpec.key] = n;
                  } else {
                    base[paramSpec.key] = raw;
                  }

                  setLocalJson(JSON.stringify(base, null, 2));
                }}
                data-testid="cb-param-input"
              />
              {error ? (
                <div className="mt-2 text-xs text-red-600">{error}</div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <div className="text-sm font-medium">
            {isBeginner ? "いまの設定（JSON）" : "Command JSON"}
          </div>
          <textarea
            className="mt-2 w-full rounded border bg-background p-3 font-mono text-xs"
            rows={10}
            value={localJson}
            onChange={(e) => {
              setLocalJson(e.target.value);
              setError(null);
            }}
            spellCheck={false}
            data-testid="cb-json"
          />
          {!parsed.ok ? (
            <div className="mt-2 text-xs text-red-600">
              {isBeginner ? "JSONがこわれてるかも: " : "Invalid JSON: "}
              {parsed.message}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border px-4 py-2 text-sm hover:bg-muted"
            onClick={props.onClose}
          >
            {isBeginner ? "キャンセル" : "Cancel"}
          </button>

          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            onClick={() => {
              if (!parsed.ok) {
                setError(isBeginner ? "JSONが正しくないよ" : "Invalid JSON");
                return;
              }
              props.onSave(selected.id, parsed.value);
              props.onClose();
            }}
            data-testid="cb-save"
            disabled={!parsed.ok}
          >
            {isBeginner ? "これでOK" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
