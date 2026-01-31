// apps/user/app/auth/sign-in/[[...sign-in]]/page.tsx

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <header className="mb-6 space-y-2">
        <h1 className="text-xl font-semibold">ログイン（任意）</h1>
        <p className="text-sm text-muted-foreground">
          保存したいときだけログインしてね。まずはゲストでも遊べるよ。
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="text-sm underline underline-offset-4 hover:opacity-80"
          >
            ゲストで続ける
          </Link>
        </div>
      </header>

      <section>
        <SignIn
          routing="path"
          path="/auth/sign-in"
          signUpUrl="/auth/sign-up"
          fallbackRedirectUrl="/"
        />
      </section>
    </main>
  );
}
