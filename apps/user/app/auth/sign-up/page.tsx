// apps/user/app/auth/sign-up/page.tsx

import { redirect } from "next/navigation";

export const dynamic = "force-static";

/**
 * パスワード/メールのサインアップは使わない方針。
 * 誤って来ても /auth/sign-in に寄せる。
 */
export default function SignUpRedirectPage() {
  redirect("/auth/sign-in");
}
