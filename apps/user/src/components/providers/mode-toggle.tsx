// apps/user/src/components/providers/mode-toggle.tsx

"use client";

import { useTheme } from "next-themes";
import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type UiMode = "normal" | "beginner";

const UI_MODE_KEY = "czz-ui-mode";
const THEME_BACKUP_KEY = "czz-theme-before-beginner";

function readUiMode(): UiMode {
  if (typeof window === "undefined") return "normal";
  const raw = window.localStorage.getItem(UI_MODE_KEY);
  return raw === "beginner" ? "beginner" : "normal";
}

function writeUiMode(mode: UiMode) {
  window.localStorage.setItem(UI_MODE_KEY, mode);
}

function backupTheme(
  theme: string | undefined,
  resolvedTheme: string | undefined,
) {
  const value = theme ?? resolvedTheme ?? "dark";
  window.localStorage.setItem(THEME_BACKUP_KEY, value);
}

function restoreTheme(): string {
  const value = window.localStorage.getItem(THEME_BACKUP_KEY);
  // ここは「上級者＝ダーク前提」に倒す（初心者モード解除で暗く戻したい要望に合わせる）
  return value && value !== "light" ? value : "dark";
}

function clearThemeBackup() {
  window.localStorage.removeItem(THEME_BACKUP_KEY);
}

export function ModeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [uiMode, setUiMode] = React.useState<UiMode>("normal");
  const lastAppliedRef = React.useRef<UiMode | null>(null);

  // hydrate uiMode from localStorage
  React.useEffect(() => {
    setUiMode(readUiMode());
  }, []);

  // apply uiMode side effects
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    // data attribute for CSS
    document.documentElement.dataset.uiMode = uiMode;
    writeUiMode(uiMode);

    // theme switching behavior
    if (lastAppliedRef.current === uiMode) return;
    lastAppliedRef.current = uiMode;

    if (uiMode === "beginner") {
      backupTheme(theme, resolvedTheme);
      setTheme("light");
      return;
    }

    // normal mode
    setTheme(restoreTheme());
    clearThemeBackup();
  }, [uiMode, setTheme, theme, resolvedTheme]);

  const isBeginner = uiMode === "beginner";

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight">基本モード</div>
        <div className="text-xs text-muted-foreground">
          Linuxコマンドを覚え始めたら解除してみよう
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">OFF</span>
        <Switch
          checked={isBeginner}
          onCheckedChange={(checked) =>
            setUiMode(checked ? "beginner" : "normal")
          }
          aria-label="初心者モードを切り替える"
        />
        <span className="text-xs text-muted-foreground">ON</span>
      </div>
    </div>
  );
}
