// apps/user/src/components/loading/LoadingOverlayRsc.tsx

type LoadingOverlayRscProps = Readonly<{
  message?: string;
  helperText?: string;
  delayMs?: number;
  helperAfterMs?: number;
  blockCount?: number;
  /** true の場合は下の画面操作をブロックする */
  blockInteraction?: boolean;
}>;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function LoadingOverlayRsc({
  message = "Now Loading",
  helperText = "通信中。画面はそのまま見えているよ",
  delayMs = 200,
  helperAfterMs = 1500,
  blockCount = 12,
  blockInteraction = true,
}: LoadingOverlayRscProps) {
  const count = clamp(blockCount, 6, 24);
  const filledText = "■".repeat(count);
  const emptyText = "□".repeat(count);

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-black/25 backdrop-blur-[2px]",
        "czz-load-fadein",
        blockInteraction ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      style={{ animationDelay: `${delayMs}ms` }}
      aria-busy="true"
      aria-live="polite"
      role="status"
      data-testid="loading-overlay"
    >
      <div className="rounded-2xl border border-white/10 bg-black/40 shadow-xl px-6 py-5 max-w-[90vw]">
        <div className="text-center font-mono text-sm sm:text-base tracking-wide">
          {/* ASCIIバー（空） + （埋め）を重ねて、埋めの幅をCSSでstepsアニメする */}
          <div className="relative inline-block whitespace-pre select-none">
            <span className="text-white/70">{`[${emptyText}]`}</span>
            <span
              className="absolute left-0 top-0 overflow-hidden czz-load-bar-fill text-white/90"
              style={{
                animationTimingFunction: `steps(${count}, end)`,
              }}
              aria-hidden="true"
            >
              {`[${filledText}]`}
            </span>
          </div>

          <div className="mt-2 text-white/90">{message}</div>

          <div
            className="mt-2 text-xs sm:text-sm text-white/70 font-sans czz-load-helper"
            style={{ animationDelay: `${helperAfterMs}ms` }}
          >
            {helperText}
          </div>
        </div>
      </div>
    </div>
  );
}
