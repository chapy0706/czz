// apps/user/src/components/beginner/ui-mode-toggle.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
	className?: string;
};

/**
 * TOP画面に置く想定の「初心者モード」トグル。
 * 画面構造には触れず、状態だけ切り替える。
 */
export function UiModeToggle({ className }: Props) {
	const mode = useUiModeStore((s) => s.mode);
	const setMode = useUiModeStore((s) => s.setMode);

	const checked = mode === "beginner";

	return (
		<div className={className}>
			<div className="flex items-center gap-3">
				<Switch
					checked={checked}
					onCheckedChange={(v) => setMode(v ? "beginner" : "advanced")}
					aria-label="初心者モード切り替え"
				/>
				<div className="leading-tight">
					<div className="text-sm font-medium">初心者モード</div>
					<div className="text-xs text-muted-foreground">
						最初はここで流れを理解しよう
					</div>
				</div>
			</div>
		</div>
	);
}
