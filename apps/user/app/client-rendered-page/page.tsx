// apps/user/app/client-rendered-page/page.tsx
"use client";

import { authClient } from "@/lib/auth/client";

export default function ClientRenderedPage() {
  const { data } = authClient.useSession();

  return (
    <main style={{ padding: 16 }}>
      <h1>Client Rendered Page</h1>
      <p>Authenticated: {data?.session ? "Yes" : "No"}</p>
      {data?.user && <p>User ID: {data.user.id}</p>}
      <pre>
        {JSON.stringify({ session: data?.session, user: data?.user }, null, 2)}
      </pre>
    </main>
  );
}
