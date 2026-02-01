// apps/user/src/components/top/BeginnerPopTitle.tsx

"use client";

import * as React from "react";

type PopTitleStyleVars = React.CSSProperties & {
  ["--czz-delay"]?: string;
  ["--czz-rot"]?: string;
};

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  /** デフォルトは「指示厨ゲーム」 */
  text?: string;
  /** 文字が落ちてくる“時間差”の間隔（ms） */
  staggerMs?: number;
  /** 丸の大きさ（ベース）。個別のバラつきは内部で少し付ける */
  size?: Size;
  className?: string;
  /** E2E などのために残す */
  "data-testid"?: string;
};

const DEFAULT_TEXT = "指示厨ゲーム";

type SizeClasses = {
  circle: string;
  container: string;
};

const SIZE_CLASSES: Record<Size, SizeClasses> = {
  sm: {
    circle: "h-10 w-10 text-lg",
    container: "gap-2",
  },
  md: {
    circle: "h-12 w-12 text-xl",
    container: "gap-3",
  },
  lg: {
    circle: "h-14 w-14 text-2xl",
    container: "gap-3 sm:gap-4",
  },
  xl: {
    // 6文字が“タイトルっぽく”見える大きさ。スマホは 3+3 の2段にする。
    circle: "h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl",
    container: "gap-3 sm:gap-5",
  },
} as const;

/**
 * パステル寄り（低彩度）で統一
 * - 文字色は基本濃いめ（視認性）
 * - 6文字以外でも idx%N で循環
 */
const PASTEL_PALETTE: Array<{ bg: string; text: string }> = [
  { bg: "bg-gradient-to-b from-rose-200 to-rose-300", text: "text-slate-900" },
  {
    bg: "bg-gradient-to-b from-amber-200 to-amber-300",
    text: "text-slate-900",
  },
  { bg: "bg-gradient-to-b from-sky-200 to-sky-300", text: "text-slate-900" },
  {
    bg: "bg-gradient-to-b from-emerald-200 to-emerald-300",
    text: "text-slate-900",
  },
  {
    bg: "bg-gradient-to-b from-violet-200 to-violet-300",
    text: "text-slate-900",
  },
  { bg: "bg-gradient-to-b from-pink-200 to-pink-300", text: "text-slate-900" },
];

const VARIANTS: Array<{ transform: string }> = [
  { transform: "scale-[0.95] -rotate-2 translate-y-[1px]" },
  { transform: "scale-[1.05] rotate-1 -translate-y-[1px]" },
  { transform: "scale-[0.99] -rotate-1 translate-y-[0px]" },
  { transform: "scale-[1.08] rotate-2 -translate-y-[2px]" },
  { transform: "scale-[0.93] -rotate-2 translate-y-[1px]" },
  { transform: "scale-[1.02] rotate-1 -translate-y-[1px]" },
];

export function BeginnerPopTitle({
  text = DEFAULT_TEXT,
  staggerMs = 110,
  size = "xl",
  className,
  "data-testid": dataTestId = "beginner-pop-title",
}: Props) {
  const chars = React.useMemo(() => Array.from(text), [text]);
  const rootClassName = ["flex flex-col items-center justify-center", className]
    .filter(Boolean)
    .join(" ");

  const sizeCls = SIZE_CLASSES[size];

  return (
    <div className={rootClassName} data-testid={dataTestId}>
      {/* 見た目は丸タイトル。検索/読み上げ向けにテキストも残す */}
      <h1 className="sr-only">{text}</h1>

      <div
        className={[
          // スマホ：上3 / 下3（3列×2行）
          "grid grid-cols-3 grid-rows-2 place-items-center",
          // sm以上：横一列（6列×1行） ※6文字以外でも自然に並ぶ
          "sm:grid-rows-1 sm:grid-flow-col sm:auto-cols-max sm:grid-cols-none",
          sizeCls.container,
        ].join(" ")}
        aria-hidden="true"
      >
        {chars.map((ch, idx) => {
          const delay = `${idx * staggerMs}ms`;
          // 落下アニメは「外側(wrapper)」に適用する（内側の transform と衝突しないように）
          const rot = idx % 2 === 0 ? "-7deg" : "7deg";
          const styleVars: PopTitleStyleVars = {
            ["--czz-delay"]: delay,
            ["--czz-rot"]: rot,
          };

          const palette = PASTEL_PALETTE[idx % PASTEL_PALETTE.length];
          const variant = VARIANTS[idx % VARIANTS.length];

          return (
            <span
              key={`${idx}-${ch}`}
              className="czz-popdrop flex items-center justify-center"
              style={styleVars}
            >
              <span
                className={[
                  "relative inline-flex items-center justify-center rounded-full",
                  "select-none font-extrabold tracking-[0.02em]",
                  // パステル配色
                  palette.bg,
                  palette.text,
                  // 質感（彩度を抑えるため、影も少し控えめ）
                  "shadow-[0_12px_22px_rgba(0,0,0,0.12)]",
                  "ring-1 ring-black/10 dark:ring-white/15",
                  "border border-white/25",
                  "backdrop-blur",
                  // ベースサイズ
                  sizeCls.circle,
                  // ちょいバラつき（サイズ/回転/上下）
                  "transform",
                  variant.transform,
                ].join(" ")}
              >
                {/* ほんのりハイライト（強すぎない） */}
                <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent dark:from-white/12" />
                <span className="relative">{ch}</span>
              </span>
            </span>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes czzDrop {
          0% {
            transform: translate3d(0, -120px, 0) scale(0.92)
              rotate(var(--czz-rot, -6deg));
            opacity: 0;
          }
          55% {
            opacity: 1;
          }
          75% {
            transform: translate3d(0, 14px, 0) scale(1.08) rotate(1deg);
          }
          88% {
            transform: translate3d(0, -6px, 0) scale(0.985) rotate(0deg);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .czz-popdrop {
          animation: czzDrop 860ms cubic-bezier(0.2, 0.9, 0.2, 1);
          animation-delay: var(--czz-delay, 0ms);
          animation-fill-mode: both;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .czz-popdrop {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
