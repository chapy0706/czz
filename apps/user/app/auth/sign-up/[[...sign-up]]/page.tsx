// apps/user/app/auth/sign-up/[[...sign-up]]/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <SignUp
        routing="path"
        path="/auth/sign-up"
        signInUrl="/auth/sign-in"
        oauthFlow="redirect"
      />
    </main>
  );
}
