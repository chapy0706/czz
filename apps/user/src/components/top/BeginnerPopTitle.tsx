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
  /** 丸の大きさ */
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
    // 6文字が“タイトルっぽく”見える大きさ。スマホでは折り返し前提。
    circle: "h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl",
    container: "gap-3 sm:gap-5",
  },
} as const;

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
          "flex flex-wrap items-center justify-center",
          sizeCls.container,
        ].join(" ")}
        aria-hidden="true"
      >
        {chars.map((ch, idx) => {
          const delay = `${idx * staggerMs}ms`;
          const rot = idx % 2 === 0 ? "-7deg" : "7deg";
          const styleVars: PopTitleStyleVars = {
            ["--czz-delay"]: delay,
            ["--czz-rot"]: rot,
          };

          return (
            <span
              key={`${idx}-${ch}`}
              className={[
                "czz-popdrop",
                "relative inline-flex items-center justify-center rounded-full",
                "select-none font-extrabold tracking-[0.02em]",
                // “ポップさ”は色より質感で出す（テーマ色に追従）
                "border border-border/60 bg-gradient-to-b from-accent/90 to-background/40 text-foreground",
                "shadow-[0_18px_30px_rgba(0,0,0,0.14)]",
                "backdrop-blur",
                "ring-1 ring-black/5 dark:ring-white/10",
                sizeCls.circle,
              ].join(" ")}
              style={styleVars}
            >
              {/* ほんのりハイライト */}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 to-transparent dark:from-white/10" />
              <span className="relative">{ch}</span>
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
