// apps/user/app/auth/google/page.tsx
"use client";

import { authClient } from "@/lib/auth/client";
import * as React from "react";

export default function GoogleSignInPage() {
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return; // React StrictMode 対策（devで2回走ることがある）
    startedRef.current = true;

    void authClient.signIn.social({
      provider: "google",
      callbackURL: "/debug/auth",
      newUserCallbackURL: "/debug/auth",
      errorCallbackURL: "/debug/auth?error=oauth",
    });
  }, []);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-lg font-semibold">Redirecting to Google…</h1>
      <p className="text-sm text-muted-foreground">
        数秒待っても飛ばない場合はリロードしてね。
      </p>
    </main>
  );
}
