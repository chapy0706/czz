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
	return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

type BreadcrumbMode = "beginner" | "normal";

function toBreadcrumbMode(mode: UiMode): BreadcrumbMode {
	// 現状: UiMode は "advanced" | "beginner"
	// パンくずの表示都合では "advanced" = "normal" 扱いにする
	return mode === "beginner" ? "beginner" : "normal";
}

/**
 * Linuxっぽい “擬似ディレクトリ名” への変換。
 * - 通常: 英字寄り（UNIX/コマンドっぽい）
 * - 初心者: 日本語（学習導線）
 */
function mapSegmentLabelByMode(
	mode: BreadcrumbMode,
	segment: string,
	index: number,
	segments: string[],
): string {
	const prev = index > 0 ? segments[index - 1] : null;

	const mapNormal: Record<string, string> = {
		tasks: "tasks",
		task: "task",
		result: "result",
		results: "results",
		running: "running",
		account: "home",
		settings: "settings",
		credits: "credits",
		debug: "debug",
		"client-rendered-page": "client",
		"server-rendered-page": "server",
	};

	const mapBeginner: Record<string, string> = {
		tasks: "課題一覧",
		task: "課題",
		result: "結果",
		results: "結果一覧",
		running: "実行中",
		account: "マイページ",
		settings: "設定",
		credits: "クレジット",
		debug: "デバッグ",
		"client-rendered-page": "クライアント",
		"server-rendered-page": "サーバー",
	};

	const m = mode === "beginner" ? mapBeginner : mapNormal;
	if (m[segment]) return m[segment];

	const looksLikeId = segment.length >= 8 && /^[a-zA-Z0-9_-]+$/.test(segment);

	if (looksLikeId && prev === "tasks") {
		const short = `${segment.slice(0, 6)}…`;
		return mode === "beginner" ? `課題:${short}` : `task-${short}`;
	}

	if (looksLikeId && prev === "results") {
		const short = `${segment.slice(0, 6)}…`;
		return mode === "beginner" ? `結果:${short}` : `result-${short}`;
	}

	if (segment.length >= 16) return `${segment.slice(0, 8)}…`;
	return segment;
}

export function GlobalBreadcrumbs({
	className,
	hiddenPathPrefixes = ["/auth", "/api"],
}: Props) {
	const pathname = usePathname() ?? "/";
	const uiMode = useUiModeStore((s) => s.mode);
	const mode = toBreadcrumbMode(uiMode);

	// ここで判定は作るが、return は Hook の後ろへ
	const hidden = isHidden(pathname, hiddenPathPrefixes);

	// Hook は常に同じ回数・同じ順で呼ぶ
	const segments = React.useMemo(
		() => pathname.split("/").filter(Boolean),
		[pathname],
	);

	const crumbs = React.useMemo(() => {
		const items: Array<{ href: string; raw: string; label: string }> = [];
		let acc = "";
		for (let i = 0; i < segments.length; i += 1) {
			acc += "/" + segments[i];
			const raw = segments[i];
			const label = mapSegmentLabelByMode(mode, raw, i, segments);
			items.push({ href: acc, raw, label });
		}
		return items;
	}, [segments, mode]);

	// ここで return（Hookの後）なら安全
	if (hidden) return null;

	const homeLabel = mode === "beginner" ? "ホーム" : "~";

	return (
		<div
			className={[
				"sticky top-0 z-40",
				"border-b bg-background/70 backdrop-blur",
				"px-3 py-2",
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
			data-testid="global-breadcrumbs"
			aria-label="パンくずリスト"
		>
			<nav className="mx-auto flex max-w-5xl items-center gap-2 text-xs">
				<span className="font-mono text-muted-foreground">$</span>

				<Link
					href="/"
					className="font-mono text-muted-foreground hover:text-foreground hover:underline"
					aria-label={mode === "beginner" ? "ホームへ戻る" : "Go home"}
				>
					{homeLabel}
				</Link>

				{crumbs.length > 0 && (
					<span className="font-mono text-muted-foreground">/</span>
				)}

				{crumbs.map((c, idx) => {
					const isLast = idx === crumbs.length - 1;
					return (
						<React.Fragment key={c.href}>
							<Link
								href={c.href}
								className={[
									"font-mono",
									isLast
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground hover:underline",
								].join(" ")}
								title={c.raw}
								aria-current={isLast ? "page" : undefined}
							>
								{c.label}
							</Link>
							{!isLast && (
								<span className="font-mono text-muted-foreground">/</span>
							)}
						</React.Fragment>
					);
				})}
			</nav>
		</div>
	);
}
