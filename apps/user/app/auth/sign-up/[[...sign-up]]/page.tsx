// apps/user/app/auth/sign-up/[[...sign-up]]/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
	return (
		<>
			<header className="space-y-2">
				<h1 className="text-xl font-semibold">新規登録</h1>
				<p className="text-sm text-muted-foreground">
					はじめての方はこちら。GoogleまたはLINEでそのまま始められます。
				</p>
			</header>

			<div className="flex justify-center rounded-xl border bg-background p-4">
				<SignUp
					routing="path"
					path="/auth/sign-up"
					signInUrl="/auth/sign-in"
					oauthFlow="redirect"
				/>
			</div>

			<p className="text-xs text-muted-foreground">
				登録後は自動でアプリに戻ります。戻らない場合は、上部の戻る操作や再読み込みを試してください。
			</p>
		</>
	);
}
