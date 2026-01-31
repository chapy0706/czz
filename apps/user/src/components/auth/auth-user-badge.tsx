// apps/user/src/components/auth/auth-user-badge.tsx

"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Pos = { x: number; y: number };

const STORAGE_KEY = "czz.authUserBadge.pos";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { x: 0, y: 0 };
    const obj = JSON.parse(raw);
    if (
      typeof obj === "object" &&
      obj &&
      typeof obj.x === "number" &&
      typeof obj.y === "number"
    ) {
      return { x: obj.x, y: obj.y };
    }
  } catch {
    // ignore
  }
  return { x: 0, y: 0 };
}

function savePos(pos: Pos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

export function AuthUserBadge() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const dragging = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);

  const [pos, setPos] = React.useState<Pos>({ x: 0, y: 0 });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setPos(loadPos());
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    savePos(pos);
  }, [mounted, pos]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ref.current) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    ref.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !last.current) return;

    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };

    const nextX = clamp(pos.x + dx, -120, 120);
    const nextY = clamp(pos.y + dy, -120, 120);

    setPos({ x: nextX, y: nextY });
  };

  const onPointerUp = () => {
    dragging.current = false;
    last.current = null;
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-full border bg-background/80 backdrop-blur px-2 py-1 shadow-sm",
        "select-none touch-none",
      )}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      title="ドラッグで移動できるよ"
    >
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-7 w-7",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button size="sm" variant="outline">
            ログイン
          </Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
