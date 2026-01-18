// apps/user/app/auth/sign-in/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { authClient } from "@/lib/auth/client";

export default function GoogleOnlySignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = React.useState<
    "checking" | "redirecting" | "ready" | "error"
  >("checking");

  const error = searchParams?.get("error");
  const startedRef = React.useRef(false);

  const go = React.useCallback(async () => {
    try {
      setStatus("redirecting");
      await authClient.signIn.social({
        provider: "google",
        // 認可後は課題選択に戻す（ここは好みで変更OK）
        callbackURL: "/tasks",
        errorCallbackURL: "/auth/sign-in?error=oauth",
      });
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (error) {
        if (!cancelled) setStatus("error");
        return;
      }

      // すでにログイン済みなら /tasks へ
      const session = await authClient.getSession();
      if (cancelled) return;

      if (session.data?.session) {
        router.replace("/tasks");
        return;
      }

      // 未ログインなら Google OAuth に直行（1回だけ）
      setStatus("ready");
      if (!startedRef.current) {
        startedRef.current = true;
        void go();
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, error, go]);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-xl font-semibold">サインイン</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        このアプリは Google ログインのみ対応です（パスワードは使いません）。
      </p>

      <div className="mt-6 rounded-2xl border bg-card/70 p-5">
        {status === "redirecting" ? (
          <div className="text-sm">Google に移動中…</div>
        ) : status === "error" ? (
          <div className="space-y-3">
            <div className="text-sm">
              サインインに失敗したか、キャンセルされたみたい。
            </div>
            <button
              type="button"
              onClick={() => void go()}
              className="w-full rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              もう一度 Google でサインイン
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void go()}
            className="w-full rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Google でサインイン
          </button>
        )}

        <div className="mt-3 text-xs text-muted-foreground">
          ※
          ブラウザ設定や拡張機能でリダイレクトが止まる場合は、上のボタンから進めます。
        </div>
      </div>
    </main>
  );
}
