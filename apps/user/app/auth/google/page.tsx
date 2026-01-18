// apps/user/app/auth/google/page.tsx
import { Suspense } from "react";
import GoogleSignInClient from "./GoogleSignInClient";

export const dynamic = "force-dynamic";

function Fallback() {
  return (
    <main className="mx-auto max-w-xl space-y-2 p-6">
      <h1 className="text-lg font-semibold">Google に移動中…</h1>
      <p className="text-sm text-muted-foreground">少し待ってね。</p>
    </main>
  );
}

export default function GooglePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <GoogleSignInClient />
    </Suspense>
  );
}
