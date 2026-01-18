// apps/user/app/auth/google/page.tsx
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

export default function GoogleSignInPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return; // React StrictMode 対策（devで2回走ることがある）
    startedRef.current = true;

    const returnTo = pickSafeReturnTo(sp.get("returnTo"));
    const callbackURL = returnTo ?? "/account/settings";

    void authClient.signIn.social({
      provider: "google",
      callbackURL,
      newUserCallbackURL: "/account/settings",
      // 失敗時は “自動リダイレクトしない” /auth/sign-in?error=... に戻す
      errorCallbackURL: "/auth/sign-in?error=oauth",
    });
  }, [sp]);

  return (
    <main className="mx-auto max-w-xl space-y-2 p-6">
      <h1 className="text-lg font-semibold">Google に移動中…</h1>
      <p className="text-sm text-muted-foreground">
        数秒待っても遷移しない場合は、ページを更新してね。
      </p>
      <button
        type="button"
        className="mt-4 inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
        onClick={() => router.refresh()}
      >
        更新
      </button>
    </main>
  );
}
