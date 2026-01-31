// apps/user/src/components/auth/auth-user-badge.tsx

"use client";

import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/nextjs";
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
  if (typeof metaName === "string" && metaName.trim().length > 0)
    return metaName.trim();

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

  // fallback: Clerkのプロフィール画像
  if (typeof user.imageUrl === "string" && user.imageUrl.length > 0)
    return user.imageUrl;

  return null;
}

export function AuthUserBadge() {
  const { isLoaded, isSignedIn, user } = useUser();

  const name = React.useMemo(() => pickDisplayName(user), [user]);
  const avatarSrc = React.useMemo(() => pickAvatarSrc(user), [user]);

  // layout.tsx 側で position を決めてる想定でも、単体でも崩れないように控えめにスタイルする
  return (
    <div
      className={cn(
        "rounded-full border bg-background/80 backdrop-blur px-2 py-1 shadow-sm",
        "flex items-center gap-2",
        "max-w-[260px]",
      )}
      aria-label="ユーザー状態"
    >
      {!isLoaded ? (
        <span className="text-xs text-muted-foreground">Loading…</span>
      ) : (
        <>
          <div className="h-7 w-7 overflow-hidden rounded-full border bg-muted shrink-0">
            {avatarSrc ? (
              // next/image を使わない：外部URL/設定で詰まらないようにする
              <img
                src={avatarSrc}
                alt="avatar"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
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
            <SignInButton fallbackRedirectUrl="/">
              <Button size="sm" variant="outline">
                ログイン
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-1">
              <Link
                href="/account/settings"
                className="text-xs underline underline-offset-4 hover:opacity-80"
              >
                設定
              </Link>
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="text-xs underline underline-offset-4 hover:opacity-80"
                >
                  ログアウト
                </button>
              </SignOutButton>
            </div>
          </SignedIn>
        </>
      )}
    </div>
  );
}
