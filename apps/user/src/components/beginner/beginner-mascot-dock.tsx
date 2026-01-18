// apps/user/src/components/beginner/beginner-mascot-dock.tsx
"use client";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import Image from "next/image";

const DEFAULT_SRC = "/assets/characters/studying.gif";
const DEFAULT_ALT = "初心者モードの案内キャラクター";

/**
 * 初心者モード中だけ、右下にキャラを常駐させる。
 * 既存画面のレイアウトに干渉しないよう fixed で出す。
 */
export function BeginnerMascotDock() {
  const mode = useUiModeStore((s) => s.mode);

  if (mode !== "beginner") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      <div className="rounded-2xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-full border bg-white">
            <Image src={DEFAULT_SRC} alt={DEFAULT_ALT} fill sizes="56px" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">いっしょにやろう</div>
            <div className="text-xs text-muted-foreground">
              まずは日本語の指示だけで組み立てよう。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
