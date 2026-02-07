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
 * - 初心者モード時のみ表示
 * - モバイル/横向きではコンパクト（トグル中心）
 * - 高さが十分あるときだけ音量スライダー表示
 *
 * 認証について:
 * - このHUDから「ログインUI」は出さない（初心者が怖がりやすい）
 * - マイページ導線は「ログイン済みのときだけ」表示
 * - ログイン/ログアウト導線は右上のユーザーバッジに集約
 *
 * 注意:
 * - 位置固定（fixed / bottom-* / right-* など）は Dock 側が担当
 * - ここは “中身だけ”
 */
export function BeginnerHud() {
	const mode = useUiModeStore((s) => s.mode);

	// Clerk（ログイン状態）
	const { isLoaded: isAuthLoaded, isSignedIn } = useUser();

	const bgmEnabled = useAudioSettingsStore((s) => s.bgmEnabled);
	const bgmVolume = useAudioSettingsStore((s) => s.volume);
	const setBgmEnabled = useAudioSettingsStore((s) => s.setBgmEnabled);
	const setBgmVolume = useAudioSettingsStore((s) => s.setVolume);

	const sfxEnabled = useAudioSettingsStore((s) => s.sfxEnabled);
	const sfxVolume = useAudioSettingsStore((s) => s.sfxVolume);
	const setSfxEnabled = useAudioSettingsStore((s) => s.setSfxEnabled);
	const setSfxVolume = useAudioSettingsStore((s) => s.setSfxVolume);

	if (mode !== "beginner") return null;

	// 未ログイン時は、HUD内にログイン導線を出さず、マイページも出さない
	const showAccountLinks = isAuthLoaded && isSignedIn;

	const bgmPercent = Math.round(bgmVolume * 100);
	const sfxPercent = Math.round(sfxVolume * 100);

	// “通常表示” は「幅 >= 640px かつ 高さ >= 520px」のときだけ有効にする
	// - スマホ横向きは width は大きくても height が小さいので、ここでコンパクトに倒れる
	const desktopQuery = "[@media(min-width:640px)_and_(min-height:520px)]";

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
		<div
			className={cn("w-auto", "sm:w-[min(92vw,380px)]")}
			role="region"
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
						<div className="text-[11px] text-muted-foreground">
							{bgmEnabled ? "ON" : "OFF"}
						</div>
						{bgmSwitch}
					</div>

					<div className="flex items-center gap-2">
						<div className="text-xs font-semibold">SE</div>
						<div className="text-[11px] text-muted-foreground">
							{sfxEnabled ? "ON" : "OFF"}
						</div>
						{sfxSwitch}
					</div>

					<div className="ml-auto flex items-center gap-2">
						<Link
							href="/credits"
							className={cn(
								"rounded-full border px-2 py-1.5 text-[11px] font-medium",
								"hover:bg-muted",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							)}
						>
							クレジット
						</Link>
					</div>
				</div>

				{/* ===== 通常表示（高さが十分あるときだけ） ===== */}
				<div className={cn("hidden", `${desktopQuery}:block`)}>
					{/* --- BGM --- */}
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<div className="text-sm font-semibold">BGM</div>
							<div className="text-xs text-muted-foreground">
								初心者モードだけ
							</div>
						</div>
						{bgmSwitch}
					</div>

					<div className="mt-3">
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">音量</div>
							<div className="text-xs tabular-nums text-muted-foreground">
								{bgmEnabled ? `${bgmPercent}%` : "OFF"}
							</div>
						</div>

						<input
							type="range"
							min={0}
							max={100}
							step={1}
							value={Math.round(bgmVolume * 100)}
							onChange={(e) => setBgmVolume(Number(e.target.value) / 100)}
							disabled={!bgmEnabled}
							className={cn(
								"mt-2 w-full",
								"accent-primary",
								!bgmEnabled && "opacity-50",
							)}
							aria-label="BGM音量"
						/>
					</div>

					<div className="my-4 border-t" />

					{/* --- SE --- */}
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<div className="text-sm font-semibold">SE</div>
							<div className="text-xs text-muted-foreground">
								ボタン操作などの効果音
							</div>
						</div>
						{sfxSwitch}
					</div>

					<div className="mt-3">
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">音量</div>
							<div className="text-xs tabular-nums text-muted-foreground">
								{sfxEnabled ? `${sfxPercent}%` : "OFF"}
							</div>
						</div>

						<input
							type="range"
							min={0}
							max={100}
							step={1}
							value={Math.round(sfxVolume * 100)}
							onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
							disabled={!sfxEnabled}
							className={cn(
								"mt-2 w-full",
								"accent-primary",
								!sfxEnabled && "opacity-50",
							)}
							aria-label="効果音の音量"
						/>
					</div>

					<div className="mt-4 flex items-center justify-end gap-2">
						<Link
							href="/credits"
							className={cn(
								"rounded-xl border px-3 py-2 text-xs font-medium",
								"hover:bg-muted",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							)}
						>
							クレジット
						</Link>
					</div>

					<div className="mt-3 text-xs text-muted-foreground">
						※ 音が鳴らないときは、画面を1回タップ or
						クリック（自動再生規制のため）
					</div>
				</div>
			</div>
		</div>
	);
}
