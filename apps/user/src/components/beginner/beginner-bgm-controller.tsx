// apps/user/src/components/beginner/beginner-bgm-controller.tsx
"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { bgmPlayer } from "@/lib/audio/BgmPlayer";
import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { bgmTrackForPath } from "@/lib/audio/bgmRoutes";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

export function BeginnerBgmController() {
	const pathname = usePathname() ?? "/";
	const mode = useUiModeStore((s) => s.mode);

	const bgmEnabled = useAudioSettingsStore((s) => s.bgmEnabled);
	const volume = useAudioSettingsStore((s) => s.volume);

	React.useEffect(() => {
		if (mode !== "beginner" || !bgmEnabled) {
			bgmPlayer.setTrack(null);
			return;
		}

		const base = bgmTrackForPath(pathname);
		if (!base) {
			bgmPlayer.setTrack(null);
			return;
		}

		const next = {
			...base,
			volume: clamp01(base.volume * clamp01(volume)),
		};

		void bgmPlayer.setTrack(next);
	}, [mode, bgmEnabled, volume, pathname]);

	return null;
}

function clamp01(v: number): number {
	if (!Number.isFinite(v)) return 0.5;
	if (v < 0) return 0;
	if (v > 1) return 1;
	return v;
}
