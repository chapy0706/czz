// apps/user/src/components/top/top-title.tsx

"use client";

import { BeginnerPopTitle } from "@/components/top/BeginnerPopTitle";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

export function TopTitle() {
	const mode = useUiModeStore((s) => s.mode);

	if (mode === "beginner") {
		return (
			<div className="pt-4 py-1" data-testid="top-title-beginner">
				<BeginnerPopTitle size="xl" />
			</div>
		);
	}

	return (
		<h1
			className="mt-4 text-3xl font-bold tracking-wide"
			data-testid="top-title-advanced"
		>
			Command Liner
		</h1>
	);
}
