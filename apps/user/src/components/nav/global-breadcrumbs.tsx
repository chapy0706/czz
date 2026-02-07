// apps/user/src/components/nav/global-breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { type UiMode, useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
	className?: string;
	/**
	 * 表示しない pathname のプレフィックス
	 * 例: ["/auth"] を指定すると /auth 以下では表示しない
	 */
	hiddenPathPrefixes?: string[];
};

function isHidden(pathname: string, prefixes: string[]): boolean {
	return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function mapSegmentLabelByMode(
	mode: UiMode,
	segment: string,
	i: number,
	segments: string[],
): string {
	if (mode === "beginner") {
		if (i === 0 && segment === "tasks") return "課題";
		if (i === 0 && segment === "results") return "結果";
		if (i === 0 && segment === "account") return "アカウント";
	}
	if (i === 0 && segment === "tasks") return "tasks";
	if (i === 0 && segment === "results") return "results";
	if (i === 0 && segment === "account") return "account";
	if (segments[i - 1] === "tasks" && segment.length > 6) return "task";
	if (segments[i - 1] === "results" && segment.length > 6) return "result";
	return segment;
}

export function GlobalBreadcrumbs({
	className,
	hiddenPathPrefixes = ["/auth"],
}: Props) {
	const pathname = usePathname();
	const mode = useUiModeStore((s) => s.mode);

	const segments = React.useMemo(() => {
		const s = pathname.split("/").filter(Boolean);
		return s;
	}, [pathname]);

	if (!pathname || pathname === "/") return null;
	if (isHidden(pathname, hiddenPathPrefixes)) return null;

	let acc = "";
	const crumbs = segments.map((seg, i) => {
		acc += `/${segments[i]}`;
		const label = mapSegmentLabelByMode(mode, seg, i, segments);
		return { href: acc, label };
	});

	return (
		<nav className={className} aria-label="breadcrumbs">
			<ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">
				<li>
					<Link className="hover:opacity-80" href="/">
						home
					</Link>
				</li>
				{crumbs.map((c) => (
					<li key={c.href} className="flex items-center gap-2">
						<span className="opacity-50">/</span>
						<Link className="hover:opacity-80" href={c.href}>
							{c.label}
						</Link>
					</li>
				))}
			</ol>
		</nav>
	);
}
