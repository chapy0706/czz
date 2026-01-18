// apps/user/app/debug/auth/AuthDebugClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { authClient } from "@/lib/auth/client";

type MeResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: unknown }
  | { ok: false; status: 0; body: { message: string } };

export default function AuthDebugClient() {
  const params = useSearchParams();
  const verifier = params?.get("neon_auth_session_verifier") ?? "none";

  const { data, error, isPending } = authClient.useSession();

  const [me, setMe] = React.useState<MeResult | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const text = await res.text();
        const body = safeJson(text);

        const next: MeResult = res.ok
          ? { ok: true, status: res.status, body }
          : { ok: false, status: res.status, body };

        if (!cancelled) setMe(next);
      } catch (e) {
        if (!cancelled) {
          setMe({
            ok: false,
            status: 0,
            body: { message: e instanceof Error ? e.message : String(e) },
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [verifier]);

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <div className="font-medium">verifier</div>
        <div className="mt-1 rounded bg-muted px-2 py-1 font-mono text-xs">
          {verifier}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          ※ verifier は URL に一時的に出るが、最終的なセッションは HttpOnly
          Cookie で管理される。
        </div>
      </div>

      <div className="text-sm">
        <div className="font-medium">authClient.useSession()</div>
        <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(
            {
              pending: isPending,
              hasSession: Boolean(data?.session),
              userId: data?.user?.id ?? null,
              error: error ? String(error) : null,
            },
            null,
            2,
          )}
        </pre>
      </div>

      <div className="text-sm">
        <div className="font-medium">GET /api/me</div>
        <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(
            me ?? { ok: false, status: -1, body: { message: "loading…" } },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}
