// apps/user/src/components/beginner/beginner-hud.tsx
"use client";

import Link from "next/link";

import { Switch } from "@/components/ui/switch";
import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

/**
 * 初心者モード専用のHUD（小さな操作パネル）
 *
 * - 初心者モード時のみ表示
 * - モバイルでは「BGM ON/OFF」だけにして、画面占有を最小化
 * - sm以上では音量スライダーも表示
 */
export function BeginnerHud() {
  const mode = useUiModeStore((s) => s.mode);

  const bgmEnabled = useAudioSettingsStore((s) => s.bgmEnabled);
  const volume = useAudioSettingsStore((s) => s.volume);
  const setBgmEnabled = useAudioSettingsStore((s) => s.setBgmEnabled);
  const setVolume = useAudioSettingsStore((s) => s.setVolume);

  if (mode !== "beginner") return null;

  const percent = Math.round(volume * 100);

  const switchEl = (
    <Switch
      checked={bgmEnabled}
      onCheckedChange={(v) => setBgmEnabled(Boolean(v))}
      aria-label={bgmEnabled ? "BGMをオフにする" : "BGMをオンにする"}
    />
  );

  return (
    <div
      className={cn(
        "fixed z-50",
        // モバイルは右下に小さく。sm以上は従来の左下に。
        "bottom-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto",
        // モバイルは自動幅。sm以上は少し幅を確保。
        "w-auto sm:w-[min(92vw,360px)]",
      )}
      role="region"
      aria-label="初心者モード 操作パネル"
    >
      <div
        className={cn(
          "rounded-2xl border bg-card/80 shadow-lg backdrop-blur",
          "p-2 sm:p-4",
        )}
      >
        {/* ===== モバイル（〜sm）: 小さくON/OFFだけ ===== */}
        <div className="flex items-center gap-3 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold">BGM</div>
            <div className="text-[11px] text-muted-foreground">
              {bgmEnabled ? "ON" : "OFF"}
            </div>
          </div>

          {switchEl}

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/account/settings"
              className={cn(
                "rounded-full border px-2 py-1.5 text-[11px] font-medium",
                "hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              アカウント
            </Link>

            <Link
              href="/credits"
              className={cn(
                "rounded-full border px-2 py-1.5 text-[11px] font-medium",
                "hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              クレジット
            </Link>
          </div>
        </div>

        {/* ===== デスクトップ（sm以上）: 従来どおり ===== */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">BGM</div>
              <div className="text-xs text-muted-foreground">
                BGMは初心者モードだけ
              </div>
            </div>

            {switchEl}
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

            <div className="mt-4 flex items-center justify-end gap-2">
              <Link
                href="/account/settings"
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs font-medium",
                  "hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                マイページ
              </Link>

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

            <div className="mt-3 text-xs text-muted-foreground">
              ※ BGMが鳴らないときは、画面を1回タップ or クリック
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
