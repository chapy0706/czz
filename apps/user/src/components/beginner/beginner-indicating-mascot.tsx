// apps/user/src/components/beginner/beginner-indicating-mascot.tsx

"use client";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import Image from "next/image";

type Props = {
  className?: string;
  /** 画像サイズ（px） */
  size?: number;
  "data-testid"?: string;
};

/**
 * 初心者モード時だけ、空きスペースに置ける案内キャラ。
 * 置く場所はページ側で決める（このコンポーネントは fixed しない）。
 */
export function BeginnerIndicatingMascot({
  className,
  size = 160,
  "data-testid": dataTestId = "beginner-indicating-mascot",
}: Props) {
  const mode = useUiModeStore((s) => s.mode);
  if (mode !== "beginner") return null;

  return (
    <div className={className} data-testid={dataTestId} aria-hidden="true">
      <Image
        src="/assets/characters/indicatinggif.gif"
        alt=""
        width={size}
        height={size}
        priority={false}
        unoptimized
      />
    </div>
  );
}
