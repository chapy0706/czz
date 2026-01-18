// apps/user/src/components/beginner/beginner-bgm-controller.tsx
"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { bgmPlayer } from "@/lib/audio/BgmPlayer";
import { bgmTrackForPath } from "@/lib/audio/bgmRoutes";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

/**
 * 初心者モード中だけ、ページに応じたBGMを流すコントローラ。
 *
 * 想定ルーティング:
 * - TOP: /
 * - 課題選択: /tasks
 * - 課題: /tasks/[taskId]
 * - リザルト: /results/[resultId]
 */
export function BeginnerBgmController() {
  const pathname = usePathname() ?? "/";
  const mode = useUiModeStore((s) => s.mode);

  React.useEffect(() => {
    if (mode !== "beginner") {
      bgmPlayer.setTrack(null);
      return;
    }

    const track = bgmTrackForPath(pathname);
    void bgmPlayer.setTrack(track);
  }, [mode, pathname]);

  return null;
}
