// apps/user/src/components/beginner/beginner-hud.tsx
"use client";

import Link from "next/link";

import { useUser } from "@clerk/nextjs";

import { Switch } from "@/components/ui/switch";
import { useAudioSettingsStore } from "@/lib/audio/audioSettingsStore";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

/**
 * 初心者モード専用のHUD（小さな操作パネル）
 *
 * - 初心者モードの ON/OFF
 * - BGM / SFX
 * - アカウント導線
 */
export function BeginnerHud() {
	const { isSignedIn } = useUser();

	const mode = useUiModeStore((s) => s.mode);
	const setMode = useUiModeStore((s) => s.setMode);

	const bgmEnabled = useAudioSettingsStore((s) => s.bgmEnabled);
	const setBgmEnabled = useAudioSettingsStore((s) => s.setBgmEnabled);

	const sfxEnabled = useAudioSettingsStore((s) => s.sfxEnabled);
	const setSfxEnabled = useAudioSettingsStore((s) => s.setSfxEnabled);

	const desktopQuery = "md";

	const modeSwitch = (
		<Switch
			checked={mode === "beginner"}
			onCheckedChange={(v) => setMode(v ? "beginner" : "advanced")}
			aria-label={
				mode === "beginner"
					? "初心者モードをオフにする"
					: "初心者モードをオンにする"
			}
		/>
	);

	const bgmSwitch = (
		<Switch
			checked={bgmEnabled}
			onCheckedChange={(v) => setBgmEnabled(Boolean(v))}
			aria-label={bgmEnabled ? "BGMをオフにする" : "BGMをオンにする"}
		/>
	);

	const sfxSwitch = (
		<Switch
			checked={sfxEnabled}
			onCheckedChange={(v) => setSfxEnabled(Boolean(v))}
			aria-label={sfxEnabled ? "効果音をオフにする" : "効果音をオンにする"}
		/>
	);

	return (
		<section
			className={cn("w-auto", "sm:w-[min(92vw,380px)]")}
			aria-label="初心者モード 操作パネル"
		>
			<div
				className={cn(
					"rounded-2xl border bg-card/80 shadow-lg backdrop-blur",
					"p-2 sm:p-4",
				)}
			>
				{/* ===== コンパクト表示（スマホ縦 / スマホ横） ===== */}
				<div
					className={cn("flex items-center gap-3", `${desktopQuery}:hidden`)}
				>
					<div className="flex items-center gap-2">
						<div className="text-xs font-semibold">BGM</div>
						{bgmSwitch}
					</div>
					<div className="flex items-center gap-2">
						<div className="text-xs font-semibold">SFX</div>
						{sfxSwitch}
					</div>
					<div className="ml-auto flex items-center gap-2">
						<div className="text-xs font-semibold">初心者</div>
						{modeSwitch}
					</div>
				</div>

				{/* ===== デスクトップ表示 ===== */}
				<div className={cn("hidden", `${desktopQuery}:block`)}>
					<div className="flex items-center justify-between gap-3">
						<div className="text-sm font-semibold">初心者モード</div>
						{modeSwitch}
					</div>

					<div className="mt-3 grid grid-cols-2 gap-2">
						<div className="flex items-center justify-between rounded-xl border px-3 py-2">
							<div className="text-sm font-medium">BGM</div>
							{bgmSwitch}
						</div>
						<div className="flex items-center justify-between rounded-xl border px-3 py-2">
							<div className="text-sm font-medium">SFX</div>
							{sfxSwitch}
						</div>
					</div>

					<div className="mt-3 flex items-center justify-between gap-2">
						{isSignedIn ? (
							<Link
								className="text-sm underline underline-offset-4 hover:opacity-80"
								href="/account/settings"
							>
								設定
							</Link>
						) : (
							<Link
								className="text-sm underline underline-offset-4 hover:opacity-80"
								href="/auth/sign-in"
							>
								ログイン
							</Link>
						)}
						<Link
							className="text-sm underline underline-offset-4 hover:opacity-80"
							href="/credits"
						>
							クレジット
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
