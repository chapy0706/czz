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
	 * BGM音量: 0.0 - 1.0
	 */
	volume: number;

	/**
	 * 効果音(SE/SFX)を鳴らすか
	 */
	sfxEnabled: boolean;
	/**
	 * SE音量: 0.0 - 1.0
	 */
	sfxVolume: number;

	setBgmEnabled: (enabled: boolean) => void;
	setVolume: (volume: number) => void;

	setSfxEnabled: (enabled: boolean) => void;
	setSfxVolume: (volume: number) => void;

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

	// ここが「爆音の保険」：デフォルトは控えめ
	sfxEnabled: true,
	sfxVolume: 0.25,
} as const;

type PersistedV1 = {
	bgmEnabled?: unknown;
	volume?: unknown;
};

type PersistedV2 = PersistedV1 & {
	sfxEnabled?: unknown;
	sfxVolume?: unknown;
};

export const useAudioSettingsStore = create<AudioSettingsState>()(
	persist(
		(set) => ({
			...DEFAULTS,

			setBgmEnabled: (enabled) => set({ bgmEnabled: enabled }),
			setVolume: (volume) => set({ volume: clamp01(volume) }),

			setSfxEnabled: (enabled) => set({ sfxEnabled: enabled }),
			setSfxVolume: (volume) => set({ sfxVolume: clamp01(volume) }),

			reset: () => set({ ...DEFAULTS }),
		}),
		{
			name: "czz-audio-settings",
			version: 2,
			migrate: (persistedState) => {
				const p = (persistedState ?? {}) as PersistedV2;

				const bgmEnabled =
					typeof p.bgmEnabled === "boolean"
						? p.bgmEnabled
						: DEFAULTS.bgmEnabled;
				const volume =
					typeof p.volume === "number" ? clamp01(p.volume) : DEFAULTS.volume;

				const sfxEnabled =
					typeof p.sfxEnabled === "boolean"
						? p.sfxEnabled
						: DEFAULTS.sfxEnabled;
				const sfxVolume =
					typeof p.sfxVolume === "number"
						? clamp01(p.sfxVolume)
						: DEFAULTS.sfxVolume;

				return {
					bgmEnabled,
					volume,
					sfxEnabled,
					sfxVolume,
				} as AudioSettingsState;
			},
		},
	),
);
