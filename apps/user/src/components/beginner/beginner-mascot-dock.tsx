// apps/user/src/components/beginner/beginner-mascot-dock.tsx
"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useMascotVariantStore } from "@/components/beginner/mascotVariantStore";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

const DEFAULT_ALT = "初心者モードの案内キャラクター";
const STORAGE_KEY = "czz:beginner-dock-pos";
const DRAG_THRESHOLD_PX = 6;
const DEFAULT_MARGIN = 12;
const DEFAULT_SIZE = { w: 240, h: 72 };
const HINTS = [
	"コマンドを触ると細かい設定ができるよ",
	"コマンドの編集画面から削除もできるよ",
];
const VARIANT_TABLE = {
	studying: {
		src: "/assets/characters/studying.gif",
		message: "いっしょにやろう",
		sub: null,
	},
	success: {
		src: "/assets/characters/indicating.gif",
		message: "おめでとう！",
		sub: null,
	},
	encourage: {
		src: "/assets/characters/cheering.gif",
		message: "もう一回見直してみよう",
		sub: null,
	},
} as const;

type DragState = {
	dragging: boolean;
	moved: boolean;
	startClientX: number;
	startClientY: number;
	startX: number;
	startY: number;
	pointerId: number | null;
	blockClick: boolean;
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

/**
 * 初心者モード中だけ、キャラを常駐させる。
 *
 * 注意:
 * - 位置固定（fixed / translate3d）をこのコンポーネントが担当する
 */
export function BeginnerMascotDock() {
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";
	const variant = useMascotVariantStore((s) => s.variant);
	const variantData = VARIANT_TABLE[variant];
	const [hintIndex, setHintIndex] = React.useState<0 | 1>(0);

	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const dragRef = React.useRef<DragState>({
		dragging: false,
		moved: false,
		startClientX: 0,
		startClientY: 0,
		startX: 0,
		startY: 0,
		pointerId: null,
		blockClick: false,
	});

	const [pos, setPos] = React.useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});

	const computeBounds = React.useCallback(() => {
		const el = containerRef.current;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		const rect = el?.getBoundingClientRect();
		const w = rect?.width ?? DEFAULT_SIZE.w;
		const h = rect?.height ?? DEFAULT_SIZE.h;

		const margin = DEFAULT_MARGIN;

		const minX = margin;
		const maxX = Math.max(margin, vw - w - margin);
		const minY = margin;
		const maxY = Math.max(margin, vh - h - margin);

		return { minX, maxX, minY, maxY, w, h };
	}, []);

	const computeDefaultPosition = React.useCallback(() => {
		const { minX, maxX, minY, maxY, w, h } = computeBounds();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		const defaultX = (vw - w) / 2;
		const defaultY = vh - h - DEFAULT_MARGIN;

		return {
			x: clamp(defaultX, minX, maxX),
			y: clamp(defaultY, minY, maxY),
		};
	}, [computeBounds]);

	const savePosition = React.useCallback((next: { x: number; y: number }) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// ignore storage errors
		}
	}, []);

	React.useEffect(() => {
		if (!isBeginner) return;
		const stored = (() => {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (!raw) return null;
				const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
				if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
					return null;
				}
				return { x: parsed.x, y: parsed.y };
			} catch {
				return null;
			}
		})();

		const { minX, maxX, minY, maxY } = computeBounds();
		if (stored) {
			setPos({
				x: clamp(stored.x, minX, maxX),
				y: clamp(stored.y, minY, maxY),
			});
			return;
		}

		const next = computeDefaultPosition();
		setPos(next);
	}, [computeBounds, computeDefaultPosition, isBeginner]);

	React.useEffect(() => {
		if (!isBeginner) return;
		const onResize = () => {
			const { minX, maxX, minY, maxY } = computeBounds();
			setPos((p) => ({
				x: clamp(p.x, minX, maxX),
				y: clamp(p.y, minY, maxY),
			}));
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [computeBounds, isBeginner]);

	React.useEffect(() => {
		if (!isBeginner) return;
		const onInteraction = () => {
			setHintIndex((v) => (v === 0 ? 1 : 0));
		};
		window.addEventListener("czz:command-interaction", onInteraction);
		return () =>
			window.removeEventListener("czz:command-interaction", onInteraction);
	}, [isBeginner]);

	const onPointerDown = (e: React.PointerEvent) => {
		const el = containerRef.current;
		if (!el) return;

		dragRef.current = {
			dragging: true,
			moved: false,
			startClientX: e.clientX,
			startClientY: e.clientY,
			startX: pos.x,
			startY: pos.y,
			pointerId: e.pointerId,
			blockClick: false,
		};

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	};

	const onPointerMove = (e: React.PointerEvent) => {
		const st = dragRef.current;
		if (!st.dragging) return;

		const dx = e.clientX - st.startClientX;
		const dy = e.clientY - st.startClientY;

		if (!st.moved) {
			const moved = Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX;
			if (!moved) return;
			st.moved = true;
		}

		const nextX = st.startX + dx;
		const nextY = st.startY + dy;

		const { minX, maxX, minY, maxY } = computeBounds();

		setPos({
			x: clamp(nextX, minX, maxX),
			y: clamp(nextY, minY, maxY),
		});
	};

	const endDrag = () => {
		const st = dragRef.current;
		if (st.moved) {
			st.blockClick = true;
			savePosition(pos);
		}
		st.dragging = false;
		st.moved = false;
		st.pointerId = null;
	};

	const onPointerUp = () => endDrag();
	const onPointerCancel = () => endDrag();

	// “フル表示” は「幅 >= 640px かつ 高さ >= 520px」のときだけ
	const desktopQuery = "[@media(min-width:640px)_and_(min-height:520px)]";

	if (!isBeginner) return null;

	return (
		<div
			ref={containerRef}
			className="fixed left-0 top-0 z-50 select-none touch-none"
			style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerCancel}
			onClickCapture={(e) => {
				if (dragRef.current.blockClick) {
					dragRef.current.blockClick = false;
					e.preventDefault();
					e.stopPropagation();
				}
			}}
		>
			<div className="rounded-2xl border bg-background/80 px-3 py-2 shadow-sm backdrop-blur cursor-grab active:cursor-grabbing touch-none">
				<div className="flex items-center gap-3">
					<div
						className={[
							"relative overflow-hidden rounded-full border bg-white",
							"h-11 w-11",
							`${desktopQuery}:h-14`,
							`${desktopQuery}:w-14`,
						].join(" ")}
					>
						<Image src={variantData.src} alt={DEFAULT_ALT} fill sizes="56px" />
					</div>

					<div className="min-w-0">
						<div
							className={[
								"font-medium leading-tight",
								"text-xs",
								`${desktopQuery}:text-sm`,
							].join(" ")}
						>
							{variantData.message}
						</div>

						{variant === "studying" ? (
							<div
								className={[
									"mt-0.5 text-muted-foreground",
									"hidden",
									`${desktopQuery}:block`,
									"text-xs",
								].join(" ")}
							>
								{HINTS[hintIndex]}
							</div>
						) : null}
					</div>

					<button
						type="button"
						className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:text-foreground"
						onClick={(e) => {
							e.stopPropagation();
							if (dragRef.current.dragging || dragRef.current.moved) return;
							const next = computeDefaultPosition();
							setPos(next);
							savePosition(next);
						}}
						onPointerDown={(e) => e.stopPropagation()}
						title="位置をリセット"
						aria-label="位置をリセット"
					>
						<RotateCcw className="h-3 w-3" aria-hidden />
					</button>
				</div>
			</div>
		</div>
	);
}
