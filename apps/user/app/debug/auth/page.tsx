// apps/user/app/debug/auth/page.tsx
"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export default function DebugAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const verifier = searchParams.get("neon_auth_session_verifier");

  React.useEffect(() => {
    // OAuth から戻った直後の「セッション確定」をトリガする
    // これで cookie が張られて、以後 /api/me が通るはず
    void authClient.getSession().finally(() => {
      // verifier を URL に残さない（ログ/共有/履歴対策）
      if (verifier) router.replace("/debug/auth");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifier]);

  return (
    <main style={{ padding: 16 }}>
      <h1>Auth Debug</h1>
      <p>verifier: {verifier ? "present" : "none"}</p>
      <p>Now checking session via authClient.getSession()…</p>
    </main>
  );
}
