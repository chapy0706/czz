// apps/user/src/lib/audio/useSfx.ts
"use client";

import * as React from "react";

type Options = {
  /** false なら鳴らさない */
  enabled?: boolean;
  /** 0.0 - 1.0 */
  volume?: number;
};

/**
 * 効果音(SFX)を安全に再生する最小フック。
 * - SSR では何もしない
 * - 連打でも「先頭から再生」を優先
 * - 再生失敗（自動再生規制など）は握りつぶす
 */
export function useSfx(src: string, options?: Options) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audioRef.current = null;
    };
  }, [src]);

  const play = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (options?.enabled === false) return;

    if (typeof options?.volume === "number") {
      audio.volume = clamp01(options.volume);
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // 自動再生規制などで失敗する場合がある。UX を壊さないため握りつぶす。
    }
  }, [options?.enabled, options?.volume]);

  return { play };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
