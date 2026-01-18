// apps/user/src/components/auth/auth-user-badge.tsx
"use client";

import Link from "next/link";

import { authClient } from "@/lib/auth/client";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "/assets/characters/player/01.png";

function pickAvatar(image: unknown): string {
  if (typeof image === "string" && image.length > 0) return image;
  return DEFAULT_AVATAR;
}

function pickName(name: unknown): string {
  if (typeof name === "string" && name.trim().length > 0) return name.trim();
  return "ログイン中";
}

export function AuthUserBadge() {
  const mode = useUiModeStore((s) => s.mode);

  const sessionHook = authClient.useSession() as any;
  const data = sessionHook?.data as any;

  const isAuthenticated = Boolean(data?.session);
  const user = (data?.user ?? data?.session?.user) as
    | { name?: string | null; image?: string | null }
    | undefined;

  if (!isAuthenticated) return null;

  const avatar = pickAvatar(user?.image);
  const name = pickName(user?.name);

  const pastel = mode === "beginner";

  return (
    <div className="fixed right-4 top-4 z-50">
      <Link
        href="/account/settings"
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm",
          "bg-card/75 backdrop-blur",
          "hover:bg-muted/40",
          pastel && "ring-1 ring-ring/40",
        )}
        aria-label="アカウント設定を開く"
      >
        <img
          src={avatar}
          alt=""
          className="h-8 w-8 rounded-full border object-cover"
        />
        <div className="min-w-0">
          <div className="max-w-[160px] truncate text-xs font-medium">
            {name}
          </div>
          <div className="text-[10px] text-muted-foreground">ログイン中</div>
        </div>
      </Link>
    </div>
  );
}
