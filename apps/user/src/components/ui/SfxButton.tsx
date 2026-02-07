// apps/user/src/components/ui/SfxButton.tsx
"use client";

import { useUiClickSfx } from "@/lib/audio/useUiClickSfx";
import * as React from "react";

export type SfxButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	sfxSrc?: string;
	sfxEnabled?: boolean;
	beginnerOnly?: boolean;
	excludeTaskPlayRoute?: boolean;
	sfxThrottleMs?: number;
};

export const SfxButton = React.forwardRef<HTMLButtonElement, SfxButtonProps>(
	(
		{
			sfxSrc,
			sfxEnabled = true,
			beginnerOnly = false,
			excludeTaskPlayRoute = true,
			sfxThrottleMs = 120,
			onClick,
			disabled,
			type,
			...props
		},
		ref,
	) => {
		const { play } = useUiClickSfx({
			src: sfxSrc,
			enabled: sfxEnabled,
			beginnerOnly,
			excludeTaskPlayRoute,
			throttleMs: sfxThrottleMs,
		});

		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (disabled) return;

				const el = e.currentTarget as HTMLElement;
				if (isElementDisabledLike(el)) return;

				void play();
				onClick?.(e);
			},
			[disabled, onClick, play],
		);

		return (
			<button
				ref={ref}
				type={type ?? "button"}
				disabled={disabled}
				onClick={handleClick}
				{...props}
			/>
		);
	},
);

SfxButton.displayName = "SfxButton";

function isElementDisabledLike(el: HTMLElement): boolean {
	if (el.getAttribute("aria-disabled") === "true") return true;
	if (el.getAttribute("data-disabled") === "true") return true;
	if (el.getAttribute("data-loading") === "true") return true;
	return false;
}
