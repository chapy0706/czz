// apps/user/src/lib/audio/useUiClickSfx.ts
"use client";

import { usePathname } from "next/navigation";
import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { useSfx } from "@/lib/audio/useSfx";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type UseUiClickSfxOptions = {
	src?: string;
	enabled?: boolean;
	beginnerOnly?: boolean;
	excludeTaskPlayRoute?: boolean;
	throttleMs?: number;
};

export function useUiClickSfx(options?: UseUiClickSfxOptions) {
	const pathname = usePathname();

	const { sfxEnabled, sfxVolume } = useAudioSettingsStore((s) => ({
		sfxEnabled: s.sfxEnabled,
		sfxVolume: s.sfxVolume,
	}));

	const mode = useUiModeStore((s) => s.mode);
	const isBeginnerMode = mode === "beginner";

	// click.mp3 が存在しない事故を避けるため、存在する push.mp3 をデフォルトにする
	const src = options?.src ?? "/audio/sfx/push.mp3";

	const excludeTaskPlayRoute = options?.excludeTaskPlayRoute ?? true;

	const canPlayByMode = options?.beginnerOnly === true ? isBeginnerMode : true;

	const canPlayByRoute = excludeTaskPlayRoute
		? !isTaskPlayRouteOnly(pathname)
		: true;

	const enabled =
		sfxEnabled && (options?.enabled ?? true) && canPlayByMode && canPlayByRoute;

	const { play } = useSfx(src, {
		enabled,
		volume: sfxVolume,
		throttleMs: options?.throttleMs ?? 120,
	});

	return { play };
}

function isTaskPlayRouteOnly(pathname: string | null): boolean {
	if (!pathname) return false;

	const clean = pathname.split("?")[0].split("#")[0];
	const parts = clean.split("/").filter(Boolean);

	// "/tasks/<taskId>" のときだけ無音
	return parts.length === 2 && parts[0] === "tasks";
}
