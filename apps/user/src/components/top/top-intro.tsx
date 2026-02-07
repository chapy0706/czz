// apps/user/src/components/top/top-intro.tsx

"use client";

import { TopTitle } from "@/components/top/top-title";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

export function TopIntro() {
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";

	return (
		<>
			<TopTitle />

			{!isBeginner && (
				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
					UNIX 的な「流れ」を、UI
					で組み立てて学ぶゲーム。コマンドを並べて実行し、テストで確かめる。
				</p>
			)}
		</>
	);
}
