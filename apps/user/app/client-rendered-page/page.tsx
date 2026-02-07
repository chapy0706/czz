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
	const { isLoaded, isSignedIn, user } = useUser();
	const { userId, sessionId, getToken } = useAuth();

	const [tokenPreview, setTokenPreview] = React.useState<string>("");

	const onShowToken = async () => {
		// デバッグ用。UI/ログに長文トークンを出すのは本番では推奨しない。
		const token = await getToken();
		setTokenPreview(token ? `${token.slice(0, 24)}...` : "(no token)");
	};

	return (
		<main className="mx-auto max-w-xl px-4 py-10">
			<h1 className="text-xl font-semibold">Client Rendered Page</h1>
			<p className="mt-2 text-sm opacity-80">
				ここはクライアント側で Clerk の認証状態を表示するテストページ。
			</p>

			<div className="mt-6 rounded-lg border p-4">
				{!isLoaded ? (
					<p className="text-sm opacity-70">Loading...</p>
				) : (
					<>
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-sm">
									status:{" "}
									<span className="font-mono">
										{isSignedIn ? "signed-in" : "signed-out"}
									</span>
								</p>
								<p className="mt-1 text-sm">
									userId:{" "}
									<span className="font-mono">{userId ?? "(none)"}</span>
								</p>
								<p className="mt-1 text-sm">
									sessionId:{" "}
									<span className="font-mono">{sessionId ?? "(none)"}</span>
								</p>
							</div>

							<div className="shrink-0">
								<SignedIn>
									<UserButton />
								</SignedIn>
							</div>
						</div>

						<div className="mt-4 flex flex-wrap gap-2">
							<SignedOut>
								<SignInButton>
									<button className="rounded-md border px-3 py-2 text-sm hover:opacity-80">
										ログイン
									</button>
								</SignInButton>
							</SignedOut>

							<SignedIn>
								<SignOutButton redirectUrl="/">
									<button className="rounded-md border px-3 py-2 text-sm hover:opacity-80">
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

						<SignedIn>
							<div className="mt-6 rounded-md bg-black/10 p-3">
								<p className="text-sm font-semibold">user</p>
								<ul className="mt-2 space-y-1 text-sm">
									<li>
										fullName:{" "}
										<span className="font-mono">
											{user?.fullName ?? "(none)"}
										</span>
									</li>
									<li>
										email:{" "}
										<span className="font-mono">
											{user?.primaryEmailAddress?.emailAddress ?? "(none)"}
										</span>
									</li>
									<li>
										displayName(unsafeMetadata):{" "}
										<span className="font-mono">
											{typeof user?.unsafeMetadata?.displayName === "string"
												? user.unsafeMetadata.displayName
												: "(none)"}
										</span>
									</li>
									<li>
										tokenPreview:{" "}
										<span className="font-mono">
											{tokenPreview || "(not fetched)"}
										</span>
									</li>
								</ul>
							</div>
						</SignedIn>
					</>
				)}
			</div>
		</main>
	);
}
