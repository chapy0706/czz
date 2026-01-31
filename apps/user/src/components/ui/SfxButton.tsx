// apps/user/src/components/ui/SfxButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useUiClickSfx } from "@/lib/audio/useUiClickSfx";
import * as React from "react";

type BaseButtonProps = React.ComponentPropsWithoutRef<typeof Button>;
type BaseButtonRef = React.ElementRef<typeof Button>;

export type SfxButtonProps = BaseButtonProps & {
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
   * 初心者モードのみ鳴らす
   * - true の場合、mode==="beginner" のときだけ鳴る
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
 * UIクリック効果音付きの Button。
 *
 * 重要:
 * - これを作っただけでは「既存の Button」が勝手に鳴るようにはならない。
 * - 鳴らしたい箇所の <Button> を <SfxButton> に置き換えていく（A案）。
 */
export const SfxButton = React.forwardRef<BaseButtonRef, SfxButtonProps>(
  (
    {
      sfxSrc,
      sfxEnabled = true,
      beginnerOnly = false,
      excludeTaskPlayRoute = true,
      sfxThrottleMs = 120,
      onClick,
      disabled,
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

        // aria-disabled / data-disabled / data-loading なども考慮（UIの慣習差を吸収）
        if (isElementDisabledLike(el)) return;

        // クリック音はUXの付加価値。失敗しても進行は止めない。
        void play();

        onClick?.(e);
      },
      [disabled, onClick, play],
    );

    return (
      <Button ref={ref} onClick={handleClick} disabled={disabled} {...props} />
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
