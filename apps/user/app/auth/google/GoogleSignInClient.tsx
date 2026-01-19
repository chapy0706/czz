// apps/user/app/auth/google/GoogleSignInClient.tsx
"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

function pickSafeReturnTo(v: string | null): string | null {
  if (!v) return null;

  // open-redirect を避ける（アプリ内の相対パスのみ許可）
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//")) return null;
  if (v.includes("\n") || v.includes("\r")) return null;

  return v;
}

const OAUTH_ATTEMPT_KEY = "czz.oauth.google.attempted";
const OAUTH_ATTEMPT_TTL_MS = 60_000; // 1分（短めで十分）

function now(): number {
  return Date.now();
}

function hasRecentAttempt(): boolean {
  try {
    const raw = sessionStorage.getItem(OAUTH_ATTEMPT_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return now() - t < OAUTH_ATTEMPT_TTL_MS;
  } catch {
    return false;
  }
}

function markAttempt(): void {
  try {
    sessionStorage.setItem(OAUTH_ATTEMPT_KEY, String(now()));
  } catch {
    // ignore
  }
}

export default function GoogleSignInClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return; // React StrictMode 対策（devで2回走ることがある）
    startedRef.current = true;

    // 直近で同じ端末から試行済みなら、無限ループを避けるため sign-in に戻して止める
    if (hasRecentAttempt()) {
      router.replace("/auth/sign-in?error=loop");
      return;
    }
    markAttempt();

    const returnTo = pickSafeReturnTo(sp.get("returnTo"));
    const callbackURL = returnTo ?? "/account/settings";

    void authClient.signIn.social({
      provider: "google",
      callbackURL,
      newUserCallbackURL: "/account/settings",
      // OAuth側で何か問題が起きたらここに戻す（= 選択画面で止める）
      errorCallbackURL: "/auth/sign-in?error=oauth",
    });
  }, [router, sp]);

  return (
    <main className="mx-auto max-w-xl space-y-2 p-6">
      <h1 className="text-lg font-semibold">Google に移動中…</h1>
      <p className="text-sm text-muted-foreground">
        数秒待っても遷移しない場合は、いったん戻って別の方法を試してね。
      </p>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
          onClick={() => router.replace("/auth/sign-in?error=stuck")}
        >
          戻る
        </button>
        <button
          type="button"
          className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
          onClick={() => router.refresh()}
        >
          更新
        </button>
      </div>
    </main>
  );
}
