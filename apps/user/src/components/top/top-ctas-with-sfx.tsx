// apps/user/src/components/top/top-ctas-with-sfx.tsx

"use client";

import { useSfx } from "@/lib/audio/useSfx";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import Link from "next/link";
import * as React from "react";

type Props = {
  className?: string;
};

/**
 * TOP の CTA。
 * - 初心者モード時のみ「push.mp3」を鳴らす
 * - Link の onClick はクライアントコンポーネントで扱う
 */
export function TopCtasWithSfx({ className }: Props) {
  const mode = useUiModeStore((s) => s.mode);
  const isBeginner = mode === "beginner";

  const { play } = useSfx("/audio/sfx/push.mp3", { volume: 1 });

  const handleClick = React.useCallback(() => {
    if (!isBeginner) return;
    void play();
  }, [isBeginner, play]);

  return (
    <div
      className={["flex flex-wrap gap-2 pt-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        href="/tasks"
        onClick={handleClick}
        className="rounded border bg-accent px-4 py-2 text-sm hover:opacity-90"
        data-testid="top-cta-tasks"
      >
        はじめる（課題一覧）
      </Link>

      <Link
        href="/result"
        onClick={handleClick}
        className="rounded border bg-background px-4 py-2 text-sm hover:bg-accent"
        data-testid="top-cta-latest-result"
      >
        直近のリザルト
      </Link>
    </div>
  );
}
