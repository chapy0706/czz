// apps/user/src/lib/audio/useSfx.ts

"use client";

import * as React from "react";

type Options = {
  /** 0.0 - 1.0 */
  volume?: number;
};

/**
 * SFX を安全に再生するための最小フック。
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

    if (typeof options?.volume === "number") {
      audio.volume = Math.min(1, Math.max(0, options.volume));
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // 自動再生規制など。UXを壊さないため握りつぶす。
    }
  }, [options?.volume]);

  return { play };
}
