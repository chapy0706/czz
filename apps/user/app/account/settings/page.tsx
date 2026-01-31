// apps/user/app/account/settings/page.tsx

"use client";

import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { SfxLink } from "@/components/ui/SfxLink";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ProfileForm = {
  name: string;
  bio: string;
  avatar: string;
};

type PrefsForm = {
  allowAnalytics: boolean;
  allowPersonalization: boolean;
  allowThirdParty: boolean;
};

const AVATAR_OPTIONS = [
  "/assets/characters/player/01.png",
  "/assets/characters/player/02.png",
  "/assets/characters/player/03.png",
  "/assets/characters/player/04.png",
  "/assets/characters/player/05.png",
  "/assets/characters/player/06.png",
  "/assets/characters/player/07.png",
  "/assets/characters/player/08.png",
] as const;

function isAvatarOption(v: unknown): v is (typeof AVATAR_OPTIONS)[number] {
  return (
    typeof v === "string" && (AVATAR_OPTIONS as readonly string[]).includes(v)
  );
}

export default function AccountSettingsPage() {
  const uiMode = useUiModeStore((s) => s.mode);
  const isBeginner = uiMode === "beginner";

  const { isLoaded, isSignedIn, user } = useUser();

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const initialName = React.useMemo(() => {
    if (!user) return "";
    const metaName = (user.unsafeMetadata?.displayName as unknown) ?? null;
    if (typeof metaName === "string" && metaName.trim().length > 0)
      return metaName;
    return user.fullName ?? user.firstName ?? "";
  }, [user]);

  const initialAvatar = React.useMemo(() => {
    if (!user) return AVATAR_OPTIONS[0];
    const metaAvatar = user.unsafeMetadata?.avatar as unknown;
    if (isAvatarOption(metaAvatar)) return metaAvatar;
    return AVATAR_OPTIONS[0];
  }, [user]);

  const [profile, setProfile] = React.useState<ProfileForm>({
    name: "",
    bio: "",
    avatar: AVATAR_OPTIONS[0],
  });

  const [prefs, setPrefs] = React.useState<PrefsForm>({
    allowAnalytics: false,
    allowPersonalization: false,
    allowThirdParty: false,
  });

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setProfile({ name: "", bio: "", avatar: AVATAR_OPTIONS[0] });
      return;
    }

    setProfile((prev) => ({
      ...prev,
      name: initialName,
      avatar: initialAvatar,
      bio:
        typeof user.unsafeMetadata?.bio === "string"
          ? user.unsafeMetadata.bio
          : "",
    }));
  }, [isLoaded, isSignedIn, user, initialName, initialAvatar]);

  const onSaveProfile = async () => {
    if (!user) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    const name = profile.name.trim();
    if (name.length === 0) {
      setSaveStatus("error");
      setErrorMessage("表示名を入力してね");
      return;
    }
    if (name.length > 30) {
      setSaveStatus("error");
      setErrorMessage("表示名は30文字以内にしてね");
      return;
    }

    try {
      // NOTE: unsafeMetadata は「上書き」なので、既存値を必ずマージしてから渡す。
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          displayName: name,
          avatar: profile.avatar,
          bio: profile.bio,
        },
      });

      await user.reload();

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (e) {
      setSaveStatus("error");
      const msg =
        e instanceof Error ? e.message : "プロフィールの保存に失敗した";
      setErrorMessage(msg);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div
        className={cn(
          "min-h-dvh flex flex-col items-center justify-center gap-4 px-4",
          isBeginner ? "bg-amber-50 text-slate-900" : "bg-background",
        )}
      >
        <Card className={cn("w-full max-w-lg p-6", isBeginner && "bg-white")}>
          <h1 className="text-xl font-semibold">アカウント設定</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            設定を見るにはログインが必要だよ。
          </p>
          <div className="mt-4 flex gap-2">
            <SignInButton>
              <Button>ログイン</Button>
            </SignInButton>
            <SfxLink href="/">
              <Button variant="outline">戻る</Button>
            </SfxLink>
          </div>
        </Card>
      </div>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div
      className={cn(
        "min-h-dvh px-4 py-10",
        isBeginner ? "bg-amber-50 text-slate-900" : "bg-background",
      )}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">アカウント設定</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              表示名やアバターを設定できるよ。
            </p>
          </div>
          <div className="shrink-0">
            <SignOutButton redirectUrl="/">
              <Button variant="outline">ログアウト</Button>
            </SignOutButton>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <Card className={cn("p-6", isBeginner && "bg-white")}>
            <h2 className="text-lg font-semibold">プロフィール</h2>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" value={email} readOnly />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">表示名</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="例: ちゃぴぃ"
                  maxLength={30}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">ひとこと</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="（任意）"
                />
              </div>

              <div className="grid gap-2">
                <Label>アバター</Label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_OPTIONS.map((src) => {
                    const selected = profile.avatar === src;
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() =>
                          setProfile((p) => ({ ...p, avatar: src }))
                        }
                        className={cn(
                          "relative h-12 w-12 overflow-hidden rounded-full border",
                          selected ? "border-primary" : "border-border",
                        )}
                        aria-pressed={selected}
                      >
                        <Image
                          src={src}
                          alt="avatar"
                          fill
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  このアバターは今は Clerk の unsafeMetadata に保存しているよ。
                </p>
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="mt-2 flex items-center gap-3">
                <Button
                  onClick={onSaveProfile}
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving"
                    ? "保存中…"
                    : saveStatus === "saved"
                      ? "保存した"
                      : "保存"}
                </Button>
                <SfxLink href="/account">
                  <Button variant="outline">アカウントへ戻る</Button>
                </SfxLink>
              </div>
            </div>
          </Card>

          <Card className={cn("p-6", isBeginner && "bg-white")}>
            <h2 className="text-lg font-semibold">プライバシー</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ここは今は UI だけ（後でDBに保存する想定）
            </p>

            <div className="mt-4 grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">利用状況の計測</p>
                  <p className="text-sm text-muted-foreground">
                    改善のための匿名集計
                  </p>
                </div>
                <Switch
                  checked={prefs.allowAnalytics}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, allowAnalytics: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">おすすめの最適化</p>
                  <p className="text-sm text-muted-foreground">
                    体験を少し良くする
                  </p>
                </div>
                <Switch
                  checked={prefs.allowPersonalization}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, allowPersonalization: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">サードパーティ連携</p>
                  <p className="text-sm text-muted-foreground">今は未使用</p>
                </div>
                <Switch
                  checked={prefs.allowThirdParty}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, allowThirdParty: v }))
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                ※
                ここを本当に効かせるときは、DBに保存してサーバー側でも参照する。
                （クライアント状態だけにすると簡単に改ざんされる）
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <SfxLink href="/">
            <Button variant="ghost">トップへ</Button>
          </SfxLink>
        </div>
      </div>
    </div>
  );
}
