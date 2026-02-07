// apps/user/src/lib/loading/useDelayedVisibility.ts
"use client";

import { useEffect, useState } from "react";

export function useDelayedVisibility(delayMs: number): boolean {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const t = window.setTimeout(() => setVisible(true), delayMs);
		return () => window.clearTimeout(t);
	}, [delayMs]);

	return visible;
}
