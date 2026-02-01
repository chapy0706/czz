// apps/user/app/auth/sign-in/[[...sign-in]]/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <SignIn
        routing="path"
        path="/auth/sign-in"
        signUpUrl="/auth/sign-up"
        oauthFlow="redirect"
      />
    </main>
  );
}
