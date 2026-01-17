// apps/user/proxy.ts
import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default neonAuthMiddleware({
  // unauthenticated はここへ
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    // 認証が必要なルートだけを列挙（まずは account だけ）
    "/account/:path*",
  ],
};
