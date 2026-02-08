// apps/user/src/components/auth/auth-user-badge.tsx

"use client";

import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignOutButton,
	useUser,
} from "@clerk/nextjs";
import { Settings } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pickDisplayName(user: ReturnType<typeof useUser>["user"]): string {
	if (!user) return "ゲスト";

	const meta = user.unsafeMetadata as
		| Record<string, unknown>
		| null
		| undefined;
	const metaName = meta?.displayName;
	if (typeof metaName === "string" && metaName.trim().length > 0) {
		return metaName.trim();
	}

	if (user.fullName && user.fullName.trim().length > 0) return user.fullName;
	if (user.firstName && user.firstName.trim().length > 0) return user.firstName;

	const email =
		user.primaryEmailAddress?.emailAddress ??
		user.emailAddresses?.[0]?.emailAddress ??
		null;

	if (email) return email.split("@")[0] ?? email;

	return "ユーザー";
}

function pickAvatarSrc(
	user: ReturnType<typeof useUser>["user"],
): string | null {
	if (!user) return null;

	const meta = user.unsafeMetadata as
		| Record<string, unknown>
		| null
		| undefined;
	const metaAvatar = meta?.avatar;
	if (typeof metaAvatar === "string" && metaAvatar.startsWith("/"))
		return metaAvatar;

	if (typeof user.imageUrl === "string" && user.imageUrl.length > 0)
		return user.imageUrl;

	return null;
}

type DragState = {
	dragging: boolean;
	startClientX: number;
	startClientY: number;
	startX: number;
	startY: number;
	pointerId: number | null;
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

export function AuthUserBadge() {
	const { isLoaded, isSignedIn, user } = useUser();

	const name = React.useMemo(() => pickDisplayName(user), [user]);
	const avatarSrc = React.useMemo(() => pickAvatarSrc(user), [user]);

	// 右上基準の transform（xは左方向がマイナス、yは下方向がプラス）
	// リロードで戻したいので localStorage に保存しない。
	const [pos, setPos] = React.useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});

	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const dragRef = React.useRef<DragState>({
		dragging: false,
		startClientX: 0,
		startClientY: 0,
		startX: 0,
		startY: 0,
		pointerId: null,
	});

	const computeBounds = React.useCallback(() => {
		const el = containerRef.current;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		const rect = el?.getBoundingClientRect();
		const w = rect?.width ?? 260;
		const h = rect?.height ?? 44;

		// CSS: top/right に 12px（= top-3 / right-3 相当）
		const margin = 12;

		// 右上固定からの移動範囲（画面内に収める）
		// x: 右へは出さない（x <= 0）。左へは左端marginまで。
		const minX = margin * 2 + w - vw;
		const maxX = 0;

		// y: 上へは出さない（y >= 0）。下へは下端marginまで。
		const minY = 0;
		const maxY = Math.max(0, vh - h - margin * 2);

		return { minX, maxX, minY, maxY };
	}, []);

	const onPointerDownHandle = (e: React.PointerEvent) => {
		const el = containerRef.current;
		if (!el) return;

		dragRef.current = {
			dragging: true,
			startClientX: e.clientX,
			startClientY: e.clientY,
			startX: pos.x,
			startY: pos.y,
			pointerId: e.pointerId,
		};

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	};

	const onPointerMoveHandle = (e: React.PointerEvent) => {
		const st = dragRef.current;
		if (!st.dragging) return;

		const dx = e.clientX - st.startClientX;
		const dy = e.clientY - st.startClientY;

		const nextX = st.startX + dx;
		const nextY = st.startY + dy;

		const { minX, maxX, minY, maxY } = computeBounds();

		setPos({
			x: clamp(nextX, minX, maxX),
			y: clamp(nextY, minY, maxY),
		});
	};

	const endDrag = () => {
		dragRef.current.dragging = false;
		dragRef.current.pointerId = null;
	};

	const onPointerUpHandle = () => endDrag();
	const onPointerCancelHandle = () => endDrag();

	React.useEffect(() => {
		const onResize = () => {
			const { minX, maxX, minY, maxY } = computeBounds();
			setPos((p) => ({
				x: clamp(p.x, minX, maxX),
				y: clamp(p.y, minY, maxY),
			}));
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [computeBounds]);

	return (
		<div
			ref={containerRef}
			className={cn(
				"fixed top-3 right-3 z-[60]",
				"rounded-full border bg-background/80 backdrop-blur shadow-sm",
				"flex items-center gap-2 px-2 py-1",
				"max-w-[280px]",
			)}
			style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
			aria-label="ユーザー状態"
		>
			{!isLoaded ? (
				<span className="text-xs text-muted-foreground">Loading…</span>
			) : (
				<>
					{/* ドラッグハンドル（アバター部分だけ） */}
					<div
						className={cn(
							"h-7 w-7 overflow-hidden rounded-full border bg-muted shrink-0",
							"cursor-grab active:cursor-grabbing",
							"touch-none select-none",
						)}
						onPointerDown={onPointerDownHandle}
						onPointerMove={onPointerMoveHandle}
						onPointerUp={onPointerUpHandle}
						onPointerCancel={onPointerCancelHandle}
						title="ここをドラッグで移動"
						aria-label="ドラッグして移動"
					>
						{avatarSrc ? (
							<img
								src={avatarSrc}
								alt="avatar"
								className="h-full w-full object-cover"
								referrerPolicy="no-referrer"
								draggable={false}
							/>
						) : null}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5">
							<span className="truncate text-sm font-medium">{name}</span>
							<span
								className={cn(
									"inline-block h-2 w-2 rounded-full",
									isSignedIn ? "bg-emerald-500" : "bg-slate-400",
								)}
								aria-hidden
							/>
						</div>
						<div className="text-[11px] leading-tight text-muted-foreground">
							{isSignedIn ? "ログイン中" : "未ログイン"}
						</div>
					</div>

					<SignedOut>
						<SignInButton
							mode="redirect"
							oauthFlow="redirect"
							forceRedirectUrl="/"
						>
							<Button size="sm" variant="outline">
								ログイン
							</Button>
						</SignInButton>
					</SignedOut>

					<SignedIn>
						<div className="flex items-center gap-2">
							<Link
								href="/account/settings"
								aria-label="設定"
								title="設定"
								data-testid="settings-button"
								className={cn(
									"inline-flex h-8 w-8 items-center justify-center rounded-full",
									"text-muted-foreground hover:text-foreground",
									"hover:bg-muted/70",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								)}
							>
								<Settings className="h-4 w-4" aria-hidden />
							</Link>

							<SignOutButton redirectUrl="/">
								<Button size="sm" variant="outline">
									ログアウト
								</Button>
							</SignOutButton>
						</div>
					</SignedIn>
				</>
			)}
		</div>
	);
}
