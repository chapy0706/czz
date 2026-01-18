// apps/user/app/auth/sign-in/page.tsx

import { AuthView } from "@neondatabase/auth/react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <AuthView pathname="sign-in" />
      </div>
    </main>
  );
}
