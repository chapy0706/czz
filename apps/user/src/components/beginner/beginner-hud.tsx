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
 * - アカウント（= 未ログインならサインインへ誘導）
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
      className={cn("fixed bottom-4 left-4 z-50", "w-[min(92vw,360px)]")}
      role="region"
      aria-label="初心者モード 操作パネル"
    >
      <div className="rounded-2xl border bg-card/80 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">BGM</div>
            <div className="text-xs text-muted-foreground">
              初心者モードだけのBGMだよ
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

          <div className="mt-4 flex items-center justify-end gap-2">
            {/* account/settings は未ログイン時に /auth/sign-in へ誘導される設計なので、導線を一本化できる */}
            <Link
              href="/account/settings"
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-medium",
                "hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              アカウント
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
            ※
            BGMが鳴らないときは、画面を1回タップ/クリックすると再生が許可されることがあるよ（ブラウザ仕様）。
          </div>
        </div>
      </div>
    </div>
  );
}
