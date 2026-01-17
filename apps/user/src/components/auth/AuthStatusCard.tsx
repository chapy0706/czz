// apps/user/src/components/auth/AuthStatusCard.tsx
"use client";

import Link from "next/link";
import * as React from "react";

type MeResponse =
  | { isAuthenticated: false }
  | {
      isAuthenticated: true;
      authUser: { id: string; email: string | null; name: string | null };
      appUser?: {
        id: unknown;
        authUserId: string;
        displayName: string;
        role: unknown;
      };
      db?: { enabled: boolean; created?: boolean };
      error?: string;
    };

async function fetchMe(): Promise<{
  status: number;
  body: MeResponse | unknown;
}> {
  const res = await fetch("/api/me", { cache: "no-store" });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = { error: "invalid json" };
  }
  return { status: res.status, body };
}

export function AuthStatusCard() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    status: number;
    body: unknown;
  } | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchMe();
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const pretty = result ? JSON.stringify(result.body, null, 2) : "";

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">Auth / DB 状態</div>
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-sm"
          onClick={reload}
          disabled={loading}
        >
          {loading ? "loading..." : "refresh"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          className="rounded-md border px-3 py-1 text-sm"
          href="/auth/sign-in"
        >
          /auth/sign-in
        </Link>
        <Link
          className="rounded-md border px-3 py-1 text-sm"
          href="/account/settings"
        >
          /account/settings
        </Link>
        <Link className="rounded-md border px-3 py-1 text-sm" href="/api/me">
          /api/me
        </Link>
      </div>

      <div className="text-xs text-muted-foreground">
        未ログインなら 401 + isAuthenticated:false。ログイン後は
        isAuthenticated:true になって、DBが有効なら appUser が返る。
      </div>

      <pre className="overflow-auto rounded-md bg-black/5 p-3 text-xs leading-relaxed">
        {result ? `HTTP ${result.status}\n${pretty}` : "loading..."}
      </pre>
    </div>
  );
}
