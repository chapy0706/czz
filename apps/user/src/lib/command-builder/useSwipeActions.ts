// apps/user/src/lib/command-builder/useSwipeActions.ts
"use client";

import * as React from "react";

type SwipeHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};

type UseSwipeActionsParams = {
  thresholdPx?: number; // default 56
  onSwipeLeft: () => void;
  onSwipeRight: () => void;

  // dnd-kit のハンドル等に触っている時はスワイプを無効化したい
  shouldIgnorePointerDown?: (target: EventTarget | null) => boolean;
};

export function useSwipeActions(params: UseSwipeActionsParams): {
  dx: number;
  isSwiping: boolean;
  handlers: SwipeHandlers;
  reset: () => void;
} {
  const thresholdPx = params.thresholdPx ?? 56;

  const startRef = React.useRef<{ x: number; y: number } | null>(null);
  const swipingRef = React.useRef(false);

  const [dx, setDx] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

  const reset = React.useCallback(() => {
    startRef.current = null;
    swipingRef.current = false;
    setDx(0);
    setIsSwiping(false);
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (params.shouldIgnorePointerDown?.(e.target)) return;

      // 左クリック/タッチのみ（右クリック等は無視）
      if (e.pointerType === "mouse" && e.button !== 0) return;

      startRef.current = { x: e.clientX, y: e.clientY };
      swipingRef.current = false;
      setDx(0);
      setIsSwiping(false);

      // 追跡のため捕捉
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [params],
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start) return;

      const nextDx = e.clientX - start.x;
      const nextDy = e.clientY - start.y;

      // 縦スクロールが主ならスワイプを発動しない
      if (!swipingRef.current) {
        if (Math.abs(nextDx) < 6 && Math.abs(nextDy) < 6) return;
        if (Math.abs(nextDx) <= Math.abs(nextDy)) return;

        swipingRef.current = true;
        setIsSwiping(true);
      }

      // 横スワイプ中はスクロール抑止（必要最小限）
      e.preventDefault();

      // 見た目が暴れないようにクランプ
      const clamped = Math.max(-120, Math.min(120, nextDx));
      setDx(clamped);
    },
    [],
  );

  const onPointerUp = React.useCallback(
    (_e: React.PointerEvent) => {
      if (!startRef.current) return;

      const finalDx = dx;
      const committed =
        swipingRef.current && Math.abs(finalDx) >= thresholdPx;

      if (committed) {
        if (finalDx < 0) params.onSwipeLeft();
        else params.onSwipeRight();
      }

      reset();
    },
    [dx, params, reset, thresholdPx],
  );

  const onPointerCancel = React.useCallback(() => {
    reset();
  }, [reset]);

  return {
    dx,
    isSwiping,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    reset,
  };
}
