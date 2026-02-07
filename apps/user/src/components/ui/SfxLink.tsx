// apps/user/src/components/ui/SfxLink.tsx
"use client";

import { useUiClickSfx } from "@/lib/audio/useUiClickSfx";
import Link, { type LinkProps } from "next/link";
import * as React from "react";

type AnchorRef = HTMLAnchorElement;

/**
 * next/link の props（href 等） + aタグのprops（target 等）
 * - onClick は本コンポーネントで包むので、ここでは a の onClick は受け取らない
 */
type AnchorProps = Omit<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	"href" | "onClick"
>;

export type SfxLinkProps = LinkProps &
	AnchorProps & {
		/**
		 * クリック音の音源パス（public 配下）
		 * 例: "/audio/sfx/click.mp3"
		 */
		sfxSrc?: string;

		/**
		 * 追加ガード（false なら鳴らさない）
		 */
		sfxEnabled?: boolean;

		/**
		 * 初心者モードのみ鳴らす（必要なら）
		 */
		beginnerOnly?: boolean;

		/**
		 * 課題プレイ画面（/tasks/[taskId]）では鳴らさない
		 * デフォルト: true
		 */
		excludeTaskPlayRoute?: boolean;

		/**
		 * 連打抑止（ms）
		 * デフォルト: 120
		 */
		sfxThrottleMs?: number;

		/**
		 * 追加のクリック処理（鳴らした後に呼ぶ）
		 */
		onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	};

/**
 * next/link をラップして UIクリック効果音を鳴らす。
 *
 * 実装メモ:
 * - Link に legacyBehavior + passHref を使い、aタグを明示して ref を正しく付与する。
 * - これで `ref as any` を消せる。
 */
export const SfxLink = React.forwardRef<AnchorRef, SfxLinkProps>(
	(
		{
			sfxSrc,
			sfxEnabled = true,
			beginnerOnly = false,
			excludeTaskPlayRoute = true,
			sfxThrottleMs = 120,
			onClick,
			// LinkProps
			href,
			as,
			replace,
			scroll,
			shallow,
			prefetch,
			locale,
			// AnchorProps
			...anchorProps
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
			(e: React.MouseEvent<HTMLAnchorElement>) => {
				// aタグなので disabled 属性は無い。disabledっぽい状態だけ吸収
				if (isElementDisabledLike(e.currentTarget)) return;

				void play();
				onClick?.(e);
			},
			[onClick, play],
		);

		return (
			<Link
				href={href}
				as={as}
				replace={replace}
				scroll={scroll}
				shallow={shallow}
				prefetch={prefetch}
				locale={locale}
				passHref
				legacyBehavior
			>
				<a ref={ref} onClick={handleClick} {...anchorProps} />
			</Link>
		);
	},
);

SfxLink.displayName = "SfxLink";

function isElementDisabledLike(el: HTMLElement): boolean {
	if (el.getAttribute("aria-disabled") === "true") return true;
	if (el.getAttribute("data-disabled") === "true") return true;
	if (el.getAttribute("data-loading") === "true") return true;
	return false;
}
