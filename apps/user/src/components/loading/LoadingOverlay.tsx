// apps/user/src/components/loading/LoadingOverlay.tsx
"use client";

import { useDelayedVisibility } from "@/lib/loading/useDelayedVisibility";
import { useEscalatedMessage } from "@/lib/loading/useEscalatedMessage";
import { usePrefersReducedMotion } from "@/lib/ui/usePrefersReducedMotion";
import { useEffect, useMemo, useState } from "react";

type LoadingOverlayProps = Readonly<{
	message?: string;
	helperText?: string;
	delayMs?: number; // 表示遅延（チラつき防止）
	helperAfterMs?: number; // 長引いたら補助文を出す
	blockCount?: number; // [■■□□] の総数
	tickMs?: number; // アニメーション速度
	/** true の場合は下の画面操作をブロックする */
	blockInteraction?: boolean;
}>;

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

function buildBar(blockCount: number, filled: number): string {
	const safeCount = clamp(blockCount, 6, 24);
	const safeFilled = clamp(filled, 0, safeCount);
	return `[${"■".repeat(safeFilled)}${"□".repeat(safeCount - safeFilled)}]`;
}

export function LoadingOverlay({
	message = "Now Loading",
	helperText = "通信中。画面はそのまま見えているよ",
	delayMs = 200,
	helperAfterMs = 1500,
	blockCount = 12,
	tickMs = 120,
	blockInteraction = true,
}: LoadingOverlayProps) {
	const visible = useDelayedVisibility(delayMs);
	const showHelper = useEscalatedMessage(helperAfterMs);
	const reducedMotion = usePrefersReducedMotion();

	const normalizedBlockCount = useMemo(
		() => clamp(blockCount, 6, 24),
		[blockCount],
	);
	const normalizedTickMs = useMemo(() => clamp(tickMs, 80, 240), [tickMs]);

	const [filled, setFilled] = useState(0);

	useEffect(() => {
		if (!visible) return;
		if (reducedMotion) return;

		let n = 0;
		const id = window.setInterval(() => {
			n = (n + 1) % (normalizedBlockCount + 1);
			setFilled(n);
		}, normalizedTickMs);

		return () => window.clearInterval(id);
	}, [visible, reducedMotion, normalizedBlockCount, normalizedTickMs]);

	if (!visible) return null;

	const bar = reducedMotion
		? buildBar(normalizedBlockCount, Math.floor(normalizedBlockCount / 2))
		: buildBar(normalizedBlockCount, filled);

	return (
		<div
			className={[
				"fixed inset-0 z-50 flex items-center justify-center",
				// “見えるけど今は待ち” を作る：透過 + 軽いブラー
				"bg-black/25 backdrop-blur-[2px]",
				// 誤操作防止が基本。眺めたいだけなら false にできる
				blockInteraction ? "pointer-events-auto" : "pointer-events-none",
			].join(" ")}
			data-testid="loading-overlay"
		>
			{/* role="status" を div に付けず、意味要素(output)に寄せる */}
			<output
				className={[
					"rounded-2xl border border-white/10 bg-black/40 shadow-xl",
					"px-6 py-5",
					"max-w-[90vw]",
				].join(" ")}
				aria-busy="true"
				aria-live="polite"
				tabIndex={-1}
			>
				<div className="text-center font-mono text-sm sm:text-base tracking-wide">
					<div className="whitespace-pre select-none">{bar}</div>
					<div className="mt-2 text-white/90">{message}</div>
					{showHelper && (
						<div className="mt-2 text-xs sm:text-sm text-white/70 font-sans">
							{helperText}
						</div>
					)}
				</div>
			</output>
		</div>
	);
}
