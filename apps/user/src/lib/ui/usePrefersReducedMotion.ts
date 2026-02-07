// apps/user/src/lib/ui/usePrefersReducedMotion.ts
"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		if (!mq) return;

		const onChange = () => setReduced(Boolean(mq.matches));
		onChange();

		// Safari互換
		if (typeof mq.addEventListener === "function") {
			mq.addEventListener("change", onChange);
			return () => mq.removeEventListener("change", onChange);
		}

		mq.addListener(onChange);
		return () => mq.removeListener(onChange);
	}, []);

	return reduced;
}
