// apps/user/src/components/auth/GoogleSignInButton.tsx
"use client";

import { authClient } from "@/lib/auth/client";

export function GoogleSignInButton() {
  const onClick = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/debug/auth",
      newUserCallbackURL: "/debug/auth",
      errorCallbackURL: "/debug/auth?error=oauth",
    });
  };

  return (
    <button type="button" onClick={onClick}>
      Sign in with Google
    </button>
  );
}
