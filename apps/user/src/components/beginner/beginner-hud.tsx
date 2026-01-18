// apps/user/src/components/beginner/beginner-hud.tsx
"use client";

import Link from "next/link";

import { Switch } from "@/components/ui/switch";
import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

/**
 * 初心者モード専用のHUD（小さな操作パネル）
 * - BGM ON/OFF
 * - 音量スライダー
 * - クレジット画面への導線
 *
 * 置き場所は layout.tsx の最下部などでOK（表示は固定配置）。
 */
export function BeginnerHud() {
  const mode = useUiModeStore((s) => s.mode);

  const bgmEnabled = useAudioSettingsStore((s) => s.bgmEnabled);
  const volume = useAudioSettingsStore((s) => s.volume);
  const setBgmEnabled = useAudioSettingsStore((s) => s.setBgmEnabled);
  const setVolume = useAudioSettingsStore((s) => s.setVolume);

  if (mode !== "beginner") return null;

  const percent = Math.round(volume * 100);

  return (
    <div
      className={cn("fixed bottom-4 left-4 z-50", "w-[min(92vw,340px)]")}
      role="region"
      aria-label="初心者モード 操作パネル"
    >
      <div className="rounded-2xl border bg-card/80 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">BGM</div>
            <div className="text-xs text-muted-foreground">
              かわいいBGM（初心者モード限定）
            </div>
          </div>

          <Switch
            checked={bgmEnabled}
            onCheckedChange={(v) => setBgmEnabled(Boolean(v))}
            aria-label={bgmEnabled ? "BGMをオフにする" : "BGMをオンにする"}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">音量</div>
            <div className="text-xs tabular-nums text-muted-foreground">
              {bgmEnabled ? `${percent}%` : "OFF"}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            disabled={!bgmEnabled}
            className={cn(
              "mt-2 w-full",
              "accent-primary",
              !bgmEnabled && "opacity-50",
            )}
            aria-label="BGM音量"
          />

          <div className="mt-3 flex items-center justify-end">
            <Link
              href="/credits"
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-medium",
                "hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              クレジット
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
