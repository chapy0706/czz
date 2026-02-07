// apps/user/proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * いまは「ゲストUX優先」なので、保護は最小限にする。
 * - /account 配下だけログイン必須
 * - それ以外（ゲーム体験や閲覧）は公開のまま
 */
const isProtectedRoute = createRouteMatcher(["/account(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// 静的ファイルと _next を除外しつつ、ページとAPIで動かす（Clerk推奨パターン）
		"/((?!.*\\..*|_next).*)",
		"/",
		"/(api|trpc)(.*)",
	],
};
