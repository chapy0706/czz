// apps/user/src/lib/command-builder/GesturePad.tsx
"use client";

import * as React from "react";

type Props = {
  onStepPlus: () => void;
  onStepMinus: () => void;
  canStepPlus: boolean;
  canStepMinus: boolean;
};

type Point = { x: number; y: number };

export function GesturePad(props: Props) {
  const { onStepPlus, onStepMinus, canStepPlus, canStepMinus } = props;

  const startRef = React.useRef<Point | null>(null);
  const firedRef = React.useRef(false);

  // 誤爆しにくいよう少し強め
  const THRESHOLD_PX = 48;
  const DOMINANCE_RATIO = 1.2; // 縦が横より 1.2倍以上大きいときだけ縦判定

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;

    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };

    // ここを入れると pointermove が安定する（特に Mac/Trackpad）
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start) return;
    if (firedRef.current) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // 縦が優勢で、閾値を超えたら発火
    const isVertical = absY >= absX * DOMINANCE_RATIO;

    if (isVertical && absY >= THRESHOLD_PX) {
      firedRef.current = true;
      startRef.current = null;

      if (dy > 0) {
        // 下スワイプ → +Step
        if (canStepPlus) onStepPlus();
      } else {
        // 上スワイプ → -Step
        if (canStepMinus) onStepMinus();
      }
    }
  };

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    startRef.current = null;
    firedRef.current = false;

    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="rounded border bg-background px-3 py-3"
      data-testid="pipe-gesture"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      style={{
        // 縦スワイプは GesturePad 内で解釈したい。
        // pan-x にしておくと、縦方向の挙動をブラウザに渡しにくくなる（= こちらで検知しやすい）
        touchAction: "pan-x",
        userSelect: "none",
      }}
      role="group"
      aria-label="Gesture pad"
    >
      <div className="text-xs font-medium text-muted-foreground">Gesture</div>
      <div className="mt-1 text-sm">
        <div>↓ swipe: +Step</div>
        <div>↑ swipe: -Step</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {canStepPlus ? "" : "(+Step disabled) "}
        {canStepMinus ? "" : "(-Step disabled)"}
      </div>
    </div>
  );
}
