// apps/user/src/lib/command-builder/GesturePad.tsx
"use client";

import * as React from "react";

type Props = {
  onStepPlus: () => void;
  onStepMinus: () => void;
  canStepPlus: boolean;
  canStepMinus: boolean;
};

export function GesturePad(props: Props) {
  const { onStepPlus, onStepMinus, canStepPlus, canStepMinus } = props;

  const startRef = React.useRef<{ x: number; y: number } | null>(null);
  const firedRef = React.useRef(false);

  const THRESHOLD = 42;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = startRef.current;
    if (!s) return;
    if (firedRef.current) return;

    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    // 縦が優勢で閾値超えたら発火
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= THRESHOLD) {
      firedRef.current = true;

      if (dy > 0) {
        // 下スワイプ = +Step
        if (canStepPlus) onStepPlus();
      } else {
        // 上スワイプ = -Step
        if (canStepMinus) onStepMinus();
      }

      startRef.current = null;
    }
  };

  const onPointerUpOrCancel = () => {
    startRef.current = null;
    firedRef.current = false;
  };

  return (
    <div
      className="rounded border bg-background px-3 py-3"
      data-testid="pipe-gesture"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
      style={{
        touchAction: "pan-x", // 縦ジェスチャをこちらで解釈（Row の横スワイプと干渉しにくい）
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
