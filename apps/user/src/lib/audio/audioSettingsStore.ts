// apps/user/src/lib/audio/audioSettingsStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AudioSettingsState = {
  /**
   * 初心者モードでBGMを鳴らすか
   */
  bgmEnabled: boolean;
  /**
   * 0.0 - 1.0
   */
  volume: number;

  setBgmEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
};

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

const DEFAULTS = {
  bgmEnabled: true,
  volume: 0.6,
} as const;

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setBgmEnabled: (enabled) => set({ bgmEnabled: enabled }),
      setVolume: (volume) => set({ volume: clamp01(volume) }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: "czz-audio-settings",
      version: 1,
      migrate: (persisted) => persisted as any,
    },
  ),
);
