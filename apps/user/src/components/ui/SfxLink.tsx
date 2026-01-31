// apps/user/src/components/ui/SfxLink.tsx
"use client";

import { useUiClickSfx } from "@/lib/audio/useUiClickSfx";
import Link from "next/link";
import * as React from "react";

type BaseLinkProps = React.ComponentPropsWithoutRef<typeof Link>;
type BaseLinkRef = HTMLAnchorElement;

export type SfxLinkProps = BaseLinkProps & {
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
};

/**
 * next/link をラップして UIクリック効果音を鳴らす。
 *
 * 重要:
 * - これも「作っただけでは自動で全部鳴らない」。
 * - 既存の `import Link from "next/link"` を
 *   `import { SfxLink as Link } from "@/components/ui/SfxLink"` に置換するのが最短。
 */
export const SfxLink = React.forwardRef<BaseLinkRef, SfxLinkProps>(
  (
    {
      sfxSrc,
      sfxEnabled = true,
      beginnerOnly = false,
      excludeTaskPlayRoute = true,
      sfxThrottleMs = 120,
      onClick,
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
      (e: React.MouseEvent<BaseLinkRef>) => {
        const el = e.currentTarget as unknown as HTMLElement;

        // Link は disabled 属性を持たないので「disabledっぽい」状態だけ吸収
        if (isElementDisabledLike(el)) return;

        void play();
        onClick?.(e);
      },
      [onClick, play],
    );

    return <Link ref={ref as any} onClick={handleClick} {...props} />;
  },
);

SfxLink.displayName = "SfxLink";

function isElementDisabledLike(el: HTMLElement): boolean {
  if (el.getAttribute("aria-disabled") === "true") return true;
  if (el.getAttribute("data-disabled") === "true") return true;
  if (el.getAttribute("data-loading") === "true") return true;
  return false;
}
