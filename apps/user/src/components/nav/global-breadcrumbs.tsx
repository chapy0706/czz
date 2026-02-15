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

const ROUTE_META: Record<string, { beginner: string; advanced: string }> = {
	"/": { beginner: "トップ", advanced: "Home" },
	"/tasks": { beginner: "課題一覧", advanced: "Tasks" },
	"/tasks/[id]": { beginner: "課題", advanced: "task" },
	"/results/running": { beginner: "実行中", advanced: "running" },
	"/results/[id]": { beginner: "結果", advanced: "result" },
	"/account": { beginner: "アカウント", advanced: "account" },
	"/credits": { beginner: "クレジット", advanced: "credits" },
};

function getRouteLabel(path: string, mode: UiMode): string | null {
	const entry = ROUTE_META[path];
	if (!entry) return null;
	return mode === "beginner" ? entry.beginner : entry.advanced;
}

function mapSegmentLabelByMode(
	mode: UiMode,
	segment: string,
	i: number,
	segments: string[],
): string {
	const fullPath = `/${segments.slice(0, i + 1).join("/")}`;
	const exact = getRouteLabel(fullPath, mode);
	if (exact) return exact;

	if (i > 0) {
		const parentPath = `/${segments.slice(0, i).join("/")}`;
		const dynamic = getRouteLabel(`${parentPath}/[id]`, mode);
		if (dynamic) return dynamic;
	}

	return segment;
}

function buildCrumbs(
	segments: string[],
	mode: UiMode,
): Array<{ href: string; label: string }> {
	let acc = "";
	const base = segments.map((seg, i) => {
		acc += `/${segments[i]}`;
		const label = mapSegmentLabelByMode(mode, seg, i, segments);
		return { href: acc, label };
	});

	if (segments[0] === "results") {
		const tasksLabel = getRouteLabel("/tasks", mode) ?? "Tasks";
		const filtered = base.filter((crumb) => crumb.href !== "/results");
		return [{ href: "/tasks", label: tasksLabel }, ...filtered];
	}

	return base;
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

	const crumbs = buildCrumbs(segments, mode);

	return (
		<nav className={`px-3 sm:px-4 ${className ?? ""}`} aria-label="breadcrumbs">
			<ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">
				<li>
					<Link
						className="inline-flex items-center rounded px-2 py-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						href="/"
					>
						{getRouteLabel("/", mode) ?? "Home"}
					</Link>
				</li>
				{crumbs.map((c) => (
					<li key={c.href} className="flex items-center gap-2">
						<span className="opacity-50">/</span>
						<Link
							className="inline-flex items-center rounded px-2 py-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							href={c.href}
						>
							{c.label}
						</Link>
					</li>
				))}
			</ol>
		</nav>
	);
}
