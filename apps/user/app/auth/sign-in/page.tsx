// apps/user/app/auth/sign-in/page.tsx
import { SfxLink as Link } from "@/components/ui/SfxLink";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

function pickSafeReturnTo(v: unknown): string | null {
  const s = typeof v === "string" ? v : null;
  if (!s) return null;

  if (!s.startsWith("/")) return null;
  if (s.startsWith("//")) return null;
  if (s.includes("\n") || s.includes("\r")) return null;

  return s;
}

function getError(sp?: Props["searchParams"]): string | null {
  const v = sp?.error;
  if (typeof v === "string") return v;
  return null;
}

function errorMessage(code: string): { title: string; body: string } {
  switch (code) {
    case "oauth":
      return {
        title: "Googleログインが完了しなかったみたい",
        body: "ブラウザ設定や通信状況で起きることがあるよ。別の方法を試すか、もう一度だけ試してみてね。",
      };
    case "loop":
      return {
        title: "ログインが繰り返されてしまった",
        body: "無限ループ防止のため、ここで止めたよ。別の方法を選んでね。",
      };
    case "stuck":
      return {
        title: "遷移が止まったかもしれない",
        body: "いったん戻って、もう一度試すか別の方法に切り替えてね。",
      };
    default:
      return {
        title: "ログインできなかったみたい",
        body: "もう一度試すか、別の方法を選んでね。",
      };
  }
}

export default function Page({ searchParams }: Props) {
  const error = getError(searchParams);
  const returnTo =
    pickSafeReturnTo(searchParams?.returnTo) ?? "/account/settings";

  const googleHref = `/auth/google?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">サインイン</h1>
        <p className="text-sm text-muted-foreground">
          ログイン方法を選んでね。
        </p>
      </div>

      {error ? (
        <div className="rounded-md border p-4">
          <div className="font-medium">{errorMessage(error).title}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {errorMessage(error).body}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <Link
          href={googleHref}
          className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Googleでログイン
        </Link>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm opacity-60"
          disabled
          title="将来のフォールバック用（必要なら実装）"
        >
          メールでログイン（準備中）
        </button>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          戻る
        </Link>
      </div>

      <div className="text-xs text-muted-foreground">
        iPhone Safari でログインが不安定な場合は、Chrome
        など別ブラウザを試すと改善することがあるよ。
      </div>
    </main>
  );
}
