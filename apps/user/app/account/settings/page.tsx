// apps/user/app/account/settings/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";

import { authClient } from "@/lib/auth/client";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

type Profile = {
  name: string;
  email: string;
  image: string;
};

const AVATAR_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `/assets/characters/player/${n}.png`;
});

function isPlayerAvatar(url: string | undefined | null): url is string {
  if (!url) return false;
  return /^\/assets\/characters\/player\/\d{2}\.png$/.test(url);
}

function clampName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "";
  return trimmed.slice(0, 24);
}

export default function AccountSettingsPage() {
  const mode = useUiModeStore((s) => s.mode);

  // Neon Auth セッション（型が揺れやすいので safe access）
  const sessionHook = authClient.useSession() as any;
  const sessionData = sessionHook?.data as any;
  const isAuthenticated = Boolean(sessionData?.session);

  const user = (sessionData?.user ?? sessionData?.session?.user) as
    | {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }
    | undefined;

  const initialProfile: Profile | null = React.useMemo(() => {
    if (!user) return null;
    return {
      name: user.name ?? "",
      email: user.email ?? "",
      image:
        user.image && user.image.length > 0 ? user.image : AVATAR_OPTIONS[0],
    };
  }, [user]);

  const [name, setName] = React.useState("");
  const [selectedAvatar, setSelectedAvatar] = React.useState<string>(
    AVATAR_OPTIONS[0],
  );
  const [status, setStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    if (!initialProfile) return;
    setName(initialProfile.name);
    setSelectedAvatar(
      isPlayerAvatar(initialProfile.image)
        ? initialProfile.image
        : AVATAR_OPTIONS[0],
    );
  }, [initialProfile]);

  const onSave = React.useCallback(async () => {
    if (!isAuthenticated) return;

    const nextName = clampName(name);
    if (nextName.length === 0) {
      setStatus("error");
      setMessage("ユーザー名を入力してね（空白だけはだめ）");
      return;
    }

    setStatus("saving");
    setMessage("");

    // Neon Auth: name / image を updateUser() で更新できる（email変更は非対応）
    const { error } = await authClient.updateUser({
      name: nextName,
      image: selectedAvatar,
    } as any);

    if (error) {
      setStatus("error");
      setMessage(error?.message ?? "更新に失敗しました");
      return;
    }

    // 反映のためセッションを再取得
    await authClient.getSession();

    setStatus("saved");
    setMessage("保存しました");
    window.setTimeout(() => setStatus("idle"), 1200);
  }, [isAuthenticated, name, selectedAvatar]);

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-semibold">アカウント</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          このページはログインが必要だよ。
        </p>
        <div className="mt-6 rounded-2xl border bg-card/70 p-5">
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Googleでサインイン
          </Link>
        </div>
      </main>
    );
  }

  const pastelCard = mode === "beginner" ? "bg-card/85" : "bg-card/70";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">アカウント設定</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ユーザー名とアイコンを変更できるよ（メールは変更しない想定）
          </p>
        </div>

        <Link
          href="/"
          className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-muted"
        >
          戻る
        </Link>
      </header>

      <section className={cn("mt-8 rounded-2xl border p-5", pastelCard)}>
        <h2 className="text-base font-semibold">プロフィール</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">ユーザー名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ちゃぴぃ"
              className={cn(
                "mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              maxLength={24}
              autoComplete="off"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              1〜24文字。空白だけはだめ。
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              メール（変更不可）
            </label>
            <div className="mt-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
              {initialProfile?.email || "—"}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Googleログインのメールは表示のみ。
            </div>
          </div>
        </div>
      </section>

      <section className={cn("mt-6 rounded-2xl border p-5", pastelCard)}>
        <h2 className="text-base font-semibold">アイコン</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          好きなアイコンを選んでね（未設定なら 01 になる）
        </p>

        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {AVATAR_OPTIONS.map((src) => {
            const selected = src === selectedAvatar;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedAvatar(src)}
                className={cn(
                  "group relative aspect-square rounded-2xl border p-2",
                  "hover:bg-muted/40",
                  selected && "ring-2 ring-ring",
                )}
                aria-label={`アイコンを選択: ${src.split("/").pop()}`}
              >
                <img
                  src={src}
                  alt=""
                  className="h-full w-full rounded-xl object-contain"
                  loading="lazy"
                />
                {selected ? (
                  <div className="pointer-events-none absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full border bg-background px-2 py-0.5 text-[10px]">
                    選択中
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {status === "error" ? (
            <span className="text-destructive">{message}</span>
          ) : status === "saved" ? (
            <span className="text-foreground">{message}</span>
          ) : status === "saving" ? (
            <span className="text-muted-foreground">保存中…</span>
          ) : (
            <span className="text-muted-foreground">{message}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={status === "saving"}
          className={cn(
            "inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium",
            "hover:bg-muted",
            "disabled:opacity-50",
          )}
        >
          保存する
        </button>
      </div>
    </main>
  );
}
