// apps/user/src/components/top/top-ctas-with-sfx.tsx
"use client";

import Link from "next/link";
import * as React from "react";

import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { useSfx } from "@/lib/audio/useSfx";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
  className?: string;
};

/**
 * TOP の CTA。
 * - 初心者モード時のみ「push.mp3」を鳴らす
 * - 音量/ONOFF は audioSettingsStore の SE 設定に従う
 */
export function TopCtasWithSfx({ className }: Props) {
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  const sfxEnabled = useAudioSettingsStore((s) => s.sfxEnabled);
  const sfxVolume = useAudioSettingsStore((s) => s.sfxVolume);

  const { play } = useSfx("/audio/sfx/push.mp3", {
    enabled: isBeginner && sfxEnabled,
    volume: sfxVolume,
  });

  const handleClick = React.useCallback(() => {
    void play();
  }, [play]);

  return (
    <div
      className={["flex flex-wrap gap-2 pt-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        href="/tasks"
        onClick={handleClick}
        className="rounded border bg-accent px-4 py-2 text-sm hover:opacity-90"
        data-testid="top-cta-tasks"
      >
        スタート
      </Link>

      <Link
        href="/result"
        onClick={handleClick}
        className="rounded border bg-background px-4 py-2 text-sm hover:bg-accent"
        data-testid="top-cta-latest-result"
      >
        直近のリザルト
      </Link>
    </div>
  );
}
