// apps/user/app/client-rendered-page/page.tsx

"use client";

import {
	SignInButton,
	SignOutButton,
	SignedIn,
	SignedOut,
	UserButton,
	useAuth,
	useUser,
} from "@clerk/nextjs";
import * as React from "react";

/**
 * Neon Auth の `authClient` を使っていたページの Clerk 版。
 * - クライアント側で「ログイン状態」「ユーザー情報」を表示
 * - ログアウト導線を用意（SignOutButton / UserButton）
 */
export default function ClientRenderedPage() {
	const { user } = useUser();
	const { isSignedIn } = useAuth();
	const [tokenHead, setTokenHead] = React.useState<string>("");

	async function onShowToken() {
		// ここはデモ用途（tokenHeadのみ表示）
		try {
			const res = await fetch("/api/me");
			const json: unknown = await res.json().catch(() => null);
			const asRecord =
				typeof json === "object" && json !== null ? (json as Record<string, unknown>) : null;
			const tok = typeof asRecord?.token === "string" ? asRecord.token : "";
			setTokenHead(tok.slice(0, 16));
		} catch {
			setTokenHead("");
		}
	}

	return (
		<main className="mx-auto max-w-2xl p-8">
			<h1 className="text-2xl font-bold">Client Rendered Page</h1>

			<div className="mt-6 space-y-4">
				<div className="rounded-xl border p-4">
					<div className="text-sm text-muted-foreground">auth</div>
					<div className="mt-2">{isSignedIn ? "signed in" : "signed out"}</div>
				</div>

				<div className="rounded-xl border p-4">
					<div className="text-sm text-muted-foreground">user</div>
					<div className="mt-2">
						<SignedIn>
							<div className="flex items-center gap-3">
								<UserButton />
								<div className="text-sm">
									<div>{user?.fullName ?? "(no name)"}</div>
									<div className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
								</div>
							</div>
						</SignedIn>

						<SignedOut>
							<div className="text-sm text-muted-foreground">未ログイン</div>
						</SignedOut>
					</div>

					<div className="mt-4 flex flex-wrap gap-2">
						<SignedOut>
							<SignInButton>
								<button
									type="button"
									className="rounded-md border px-3 py-2 text-sm hover:opacity-80"
								>
									ログイン
								</button>
							</SignInButton>
						</SignedOut>

						<SignedIn>
							<SignOutButton redirectUrl="/">
								<button
									type="button"
									className="rounded-md border px-3 py-2 text-sm hover:opacity-80"
								>
									ログアウト
								</button>
							</SignOutButton>

							<button
								type="button"
								onClick={onShowToken}
								className="rounded-md border px-3 py-2 text-sm hover:opacity-80"
							>
								トークン確認（先頭だけ）
							</button>
						</SignedIn>
					</div>

					{tokenHead ? (
						<div className="mt-3 text-xs text-muted-foreground">token: {tokenHead}...</div>
					) : null}
				</div>
			</div>
		</main>
	);
}
