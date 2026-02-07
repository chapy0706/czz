// apps/user/src/components/ui/SfxLink.tsx
"use client";

import Link, { type LinkProps } from "next/link";
import * as React from "react";

import { useUiClickSfx } from "@/lib/audio/useUiClickSfx";

type AnchorRef = HTMLAnchorElement;
type AnchorProps = Omit<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	"href" | "onClick"
>;

export type SfxLinkProps = LinkProps &
	AnchorProps & {
		/**
		 * クリック音を鳴らすか（デフォルト: true）
		 * ※ 詳細条件（初心者のみ / 特定ルート除外 など）は呼び出し側で制御してOK。
		 */
		sfxEnabled?: boolean;

		/**
		 * 追加のクリック処理（鳴らした後に呼ぶ）
		 */
		onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	};

/**
 * next/link をラップして UIクリック効果音を鳴らす。
 *
 * ✅ プロジェクト実態に合わせる:
 * - useUiClickSfx() の返り値は { play } だけ
 * - options に sfxSrc は無いので渡さない
 * - <a> を手で書かず Link を直接返す（Biome a11y: useValidAnchor 対策）
 */
export const SfxLink = React.forwardRef<AnchorRef, SfxLinkProps>(
	(
		{
			sfxEnabled = true,
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
		const { play } = useUiClickSfx();

		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLAnchorElement>) => {
				if (sfxEnabled) void play();
				onClick?.(e);
			},
			[onClick, play, sfxEnabled],
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
				ref={ref}
				onClick={handleClick}
				{...anchorProps}
			/>
		);
	},
);

SfxLink.displayName = "SfxLink";
