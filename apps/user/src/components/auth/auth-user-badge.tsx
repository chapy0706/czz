// apps/user/src/components/auth/auth-user-badge.tsx
"use client";

import Link from "next/link";
import * as React from "react";

import { authClient } from "@/lib/auth/client";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "/assets/characters/player/01.png";
const STORAGE_KEY = "czz-auth-user-badge-pos-v1";

// 余白（px）。安全側に少し大きめ。
const MARGIN = 12;

// クリック抑制の閾値（px）
const DRAG_THRESHOLD = 4;

type Pos = { x: number; y: number };
type Size = { w: number; h: number };

function pickAvatar(image: unknown): string {
  if (typeof image === "string" && image.length > 0) return image;
  return DEFAULT_AVATAR;
}

function pickName(name: unknown): string {
  if (typeof name === "string" && name.trim().length > 0) return name.trim();
  return "ログイン中";
}

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function clampPos(pos: Pos, size: Size): Pos {
  const maxX = Math.max(MARGIN, window.innerWidth - size.w - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - size.h - MARGIN);

  return {
    x: clamp(pos.x, MARGIN, maxX),
    y: clamp(pos.y, MARGIN, maxY),
  };
}

function readStoredPos(): Pos | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number")
      return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

function writeStoredPos(pos: Pos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // storage が使えない環境でも動作は継続
  }
}

export function AuthUserBadge() {
  const mode = useUiModeStore((s) => s.mode);

  // NOTE: 初回レンダリングは session が未確定になりやすい。
  // Hooks の順序が変わらないよう、以降の hooks は「認証状態に関係なく」必ず呼ぶ。
  const sessionHook = authClient.useSession() as any;
  const data = sessionHook?.data as any;

  const isAuthenticated = Boolean(data?.session);
  const user = (data?.user ?? data?.session?.user) as
    | { name?: string | null; image?: string | null }
    | undefined;

  const avatar = pickAvatar(user?.image);
  const name = pickName(user?.name);
  const pastel = mode === "beginner";

  // 位置/サイズ管理
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const badgeRef = React.useRef<HTMLDivElement | null>(null);

  const sizeRef = React.useRef<Size>({ w: 0, h: 0 });
  const [pos, setPos] = React.useState<Pos | null>(null);

  // クリック抑制（ドラッグ後に誤クリックで遷移しない）
  const suppressClickRef = React.useRef(false);

  // 初期位置（右上）
  const computeDefaultPos = React.useCallback((): Pos => {
    const size = sizeRef.current;
    const x = Math.max(MARGIN, window.innerWidth - size.w - MARGIN);
    const y = MARGIN;
    return { x, y };
  }, []);

  // サイズ計測（ResizeObserver）
  React.useEffect(() => {
    // 未ログイン時は何も出さない（pos は一旦消してOK）
    if (!isAuthenticated) {
      setPos(null);
      return;
    }

    const el = badgeRef.current;
    if (!el) return;

    const apply = () => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };

      setPos((prev) => {
        if (!prev) {
          const stored = readStoredPos();
          const base = stored ?? computeDefaultPos();
          return clampPos(base, sizeRef.current);
        }
        return clampPos(prev, sizeRef.current);
      });
    };

    apply();

    const roSupported = typeof ResizeObserver !== "undefined";
    if (!roSupported) return;

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);

    return () => ro.disconnect();
  }, [isAuthenticated, computeDefaultPos]);

  // 画面リサイズ時に位置を再クランプ
  React.useEffect(() => {
    const onResize = () => {
      setPos((prev) => {
        if (!prev) return prev;
        return clampPos(prev, sizeRef.current);
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ドラッグ状態
  const dragRef = React.useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    didDrag: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    didDrag: false,
  });

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isAuthenticated) return;

      // 左クリック or タッチのみ
      if (e.pointerType === "mouse" && e.button !== 0) return;

      if (!pos) return;

      dragRef.current.active = true;
      dragRef.current.pointerId = e.pointerId;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.originX = pos.x;
      dragRef.current.originY = pos.y;
      dragRef.current.didDrag = false;

      suppressClickRef.current = false;

      const el = containerRef.current;
      try {
        el?.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [isAuthenticated, pos],
  );

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (
      !dragRef.current.didDrag &&
      (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
    ) {
      dragRef.current.didDrag = true;
      suppressClickRef.current = true;
    }

    const next = clampPos(
      { x: dragRef.current.originX + dx, y: dragRef.current.originY + dy },
      sizeRef.current,
    );

    setPos(next);
  }, []);

  const endDrag = React.useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    dragRef.current.active = false;

    setPos((p) => {
      if (p) writeStoredPos(p);
      return p;
    });

    const el = containerRef.current;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onClickCapture = React.useCallback((e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }, []);

  const onDoubleClick = React.useCallback(() => {
    const reset = clampPos(computeDefaultPos(), sizeRef.current);
    setPos(reset);
    writeStoredPos(reset);
  }, [computeDefaultPos]);

  if (!isAuthenticated) return null;

  return (
    <div
      ref={containerRef}
      className={cn("fixed left-0 top-0 z-50", pos ? "visible" : "invisible")}
      style={{
        transform: pos ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onDoubleClick}
    >
      <div
        ref={badgeRef}
        className={cn(
          "cursor-grab active:cursor-grabbing",
          "touch-none select-none",
        )}
      >
        <Link
          href="/account/settings"
          onClickCapture={onClickCapture}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm",
            "bg-card/75 backdrop-blur",
            "hover:bg-muted/40",
            pastel && "ring-1 ring-ring/40",
          )}
          aria-label="アカウント設定を開く（ドラッグで位置を移動できます）"
        >
          <img
            src={avatar}
            alt=""
            className="h-8 w-8 rounded-full border object-cover"
            draggable={false}
          />
          <div className="min-w-0">
            <div className="max-w-[160px] truncate text-xs font-medium">
              {name}
            </div>
            <div className="text-[10px] text-muted-foreground">ログイン中</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
