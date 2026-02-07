// apps/user/src/lib/audio/useSfx.ts
"use client";

import * as React from "react";

type Options = {
	enabled?: boolean;
	volume?: number;
	throttleMs?: number;
};

export function useSfx(src: string, options?: Options) {
	const audioRef = React.useRef<HTMLAudioElement | null>(null);
	const lastPlayedAtRef = React.useRef<number>(Number.NEGATIVE_INFINITY);

	React.useEffect(() => {
		if (typeof window === "undefined") return;

		const audio = new Audio(src);
		audio.preload = "auto";
		audioRef.current = audio;

		// 開発時だけ「音源が死んでる」系を気づけるようにする
		const onError = () => {
			if (process.env.NODE_ENV !== "production") {
				// eslint-disable-next-line no-console
				console.warn(`[SFX] failed to load/play: ${src}`);
			}
		};
		audio.addEventListener("error", onError);

		return () => {
			audio.removeEventListener("error", onError);
			audioRef.current = null;
		};
	}, [src]);

	const play = React.useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) return;

		if (options?.enabled === false) return;

		const throttleMs =
			typeof options?.throttleMs === "number" ? options.throttleMs : 0;

		if (throttleMs > 0) {
			const now =
				typeof performance !== "undefined" ? performance.now() : Date.now();
			if (now - lastPlayedAtRef.current < throttleMs) return;
			lastPlayedAtRef.current = now;
		}

		if (typeof options?.volume === "number") {
			audio.volume = clamp01(options.volume);
		}

		try {
			audio.currentTime = 0;
			await audio.play();
		} catch {
			// 自動再生規制などで失敗する場合がある。UX を壊さないため握りつぶす。
		}
	}, [options?.enabled, options?.throttleMs, options?.volume]);

	return { play };
}

function clamp01(v: number): number {
	if (!Number.isFinite(v)) return 0.5;
	if (v < 0) return 0;
	if (v > 1) return 1;
	return v;
}
