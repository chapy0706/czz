// apps/user/src/components/providers/DebugPanelGate.tsx
"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const IS_DEV = process.env.NODE_ENV === "development";
// dev の時だけ import（production build で巻き込まれない）
const LazyDebugPanel = IS_DEV
	? dynamic(
			() => import("@/components/debug/DebugPanel").then((m) => m.DebugPanel),
			{
				ssr: false,
			},
		)
	: null;

function isLocalhostHost(hostname: string) {
	return (
		hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
	);
}

export function DebugPanelGate() {
	// ✅ 初回レンダーで window を見ない（Hydration対策）
	const [mounted, setMounted] = React.useState(false);
	const [isLocalhost, setIsLocalhost] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
		setIsLocalhost(isLocalhostHost(window.location.hostname));
	}, []);

	if (!IS_DEV) return null;

	// 初回は必ず null（server/client で一致させる）
	if (!mounted) return null;

	// ローカル専用
	if (!isLocalhost) return null;

	if (!LazyDebugPanel) return null;
	return <LazyDebugPanel />;
}
