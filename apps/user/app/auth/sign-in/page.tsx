// apps/user/app/auth/sign-in/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  // Next 16+ では searchParams が Promise 扱いになるケースがある
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function SignInPage({ searchParams }: Props) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  // 通常の導線は「即 Google OAuth へ」
  if (!error) {
    redirect("/auth/google?returnTo=/account/settings");
  }

  // error がある時だけ “止まる” （無限ループ防止）
  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-lg font-semibold">サインインに失敗したみたい</h1>

      <div className="rounded border bg-card p-4 text-sm">
        <p className="text-muted-foreground">
          もう一度 Google でサインインを試してね。
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          error: <code>{error}</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/auth/google?returnTo=/account/settings"
          className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Google で再試行
        </Link>

        <Link
          href="/"
          className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
