// apps/user/src/components/beginner/beginner-hud.tsx
"use client";

import Link from "next/link";

import { Switch } from "@/components/ui/switch";
import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { cn } from "@/lib/utils";

/**
 * 初心者モード専用のHUD（小さな操作パネル）
 *
 * - BGM / SFX
 * - クレジット導線
 */
export function BeginnerHud() {
	const bgmEnabled = useAudioSettingsStore((s) => s.bgmEnabled);
	const setBgmEnabled = useAudioSettingsStore((s) => s.setBgmEnabled);

	const sfxEnabled = useAudioSettingsStore((s) => s.sfxEnabled);
	const setSfxEnabled = useAudioSettingsStore((s) => s.setSfxEnabled);

	const bgmSwitch = (
		<Switch
			id="beginner-bgm-toggle"
			checked={bgmEnabled}
			onCheckedChange={(v) => setBgmEnabled(Boolean(v))}
			aria-label={bgmEnabled ? "BGMをオフにする" : "BGMをオンにする"}
			className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
		/>
	);

	const sfxSwitch = (
		<Switch
			id="beginner-sfx-toggle"
			checked={sfxEnabled}
			onCheckedChange={(v) => setSfxEnabled(Boolean(v))}
			aria-label={sfxEnabled ? "効果音をオフにする" : "効果音をオンにする"}
			className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
		/>
	);

	return (
		<section
			className={cn("w-[33vw] max-w-[260px]")}
			aria-label="初心者モード 操作パネル"
		>
			<div
				className={cn(
					"rounded-xl border bg-card/80 shadow-lg backdrop-blur",
					"p-1.5",
				)}
			>
				<div className="flex flex-col gap-1">
					<div
						className={cn(
							"flex items-center justify-between rounded-xl border px-2 py-1",
							bgmEnabled
								? "border-sky-300/70 bg-sky-50 text-sky-950"
								: "border-border bg-background/60 text-foreground",
						)}
					>
						<label
							className={cn(
								"text-xs font-semibold",
								bgmEnabled ? "text-sky-900" : "text-foreground",
							)}
							htmlFor="beginner-bgm-toggle"
						>
							BGM
						</label>
						{bgmSwitch}
					</div>

					<div
						className={cn(
							"flex items-center justify-between rounded-xl border px-2 py-1",
							sfxEnabled
								? "border-sky-300/70 bg-sky-50 text-sky-950"
								: "border-border bg-background/60 text-foreground",
						)}
					>
						<label
							className={cn(
								"text-xs font-semibold",
								sfxEnabled ? "text-sky-900" : "text-foreground",
							)}
							htmlFor="beginner-sfx-toggle"
						>
							SFX
						</label>
						{sfxSwitch}
					</div>

					<Link
						className={cn(
							"inline-flex items-center justify-center rounded-xl border px-2 py-1 text-xs font-semibold",
							"hover:bg-muted/60",
						)}
						href="/credits"
					>
						クレジット
					</Link>
				</div>
			</div>
		</section>
	);
}
