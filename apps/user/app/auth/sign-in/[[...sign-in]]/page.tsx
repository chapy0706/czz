// apps/user/app/auth/sign-in/[[...sign-in]]/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-[420px] space-y-6">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold">ログイン</h1>
          <p className="text-sm text-muted-foreground">
            ログインするとこのアプリの学習記録が残せるよ！
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
            <li>ログインしなくてもゲストユーザーでも遊べるよ！</li>
            <li>うまくいかない場合は、いったんページを更新してみてね。</li>
          </ul>
        </header>

        <div className="rounded-xl border bg-background p-4">
          <SignIn
            routing="path"
            path="/auth/sign-in"
            signUpUrl="/auth/sign-up"
            oauthFlow="redirect"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          ※
          OAuth（Google/LINE）の方式は環境によりポップアップ/リダイレクトが変わることがありますが、
          ここでは同一タブで進むようリダイレクト方式を指定しています。
        </p>
      </div>
    </main>
  );
}
