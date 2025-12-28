// apps/user/src/lib/components/command-builder/GesturePad.tsx
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

  const startYRef = React.useRef<number | null>(null);
  const THRESHOLD = 32; // 24-40px あたりが無難

  return (
    <div className="rounded border bg-muted p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Gesture Pad（縦スワイプで Step を増減）
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border bg-background px-2 py-1 text-xs disabled:opacity-50"
            onClick={onStepMinus}
            disabled={!canStepMinus}
            title="- Step"
          >
            - Step
          </button>
          <button
            type="button"
            className="rounded border bg-background px-2 py-1 text-xs disabled:opacity-50"
            onClick={onStepPlus}
            disabled={!canStepPlus}
            title="+ Step"
          >
            + Step
          </button>
        </div>
      </div>

      <div
        className="mt-2 rounded border bg-background px-3 py-6 text-center text-sm text-muted-foreground"
        data-testid="pipe-gesture"
        style={{
          // スワイプ専用領域：スクロールとの衝突を減らす
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={(e) => {
          startYRef.current = e.clientY;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          const startY = startYRef.current;
          startYRef.current = null;
          if (startY == null) return;

          const dy = e.clientY - startY;

          // 上スワイプ（dy<0）で step++
          if (dy < -THRESHOLD) {
            if (canStepPlus) onStepPlus();
            return;
          }
          // 下スワイプ（dy>0）で step--
          if (dy > THRESHOLD) {
            if (canStepMinus) onStepMinus();
            return;
          }
        }}
      >
        ↑ swipe up: +Step / ↓ swipe down: -Step
      </div>
    </div>
  );
}
