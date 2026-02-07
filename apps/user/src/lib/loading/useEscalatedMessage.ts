// apps/user/src/lib/loading/useEscalatedMessage.ts
"use client";

import { useEffect, useState } from "react";

export function useEscalatedMessage(thresholdMs: number): boolean {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const t = window.setTimeout(() => setShow(true), thresholdMs);
		return () => window.clearTimeout(t);
	}, [thresholdMs]);

	return show;
}
