// apps/user/src/components/providers/neon-auth-ui-provider.tsx
"use client";

import { authClient } from "@/lib/auth/client";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import * as React from "react";

type Props = {
  children: React.ReactNode;
};

type ProviderAuthClient = React.ComponentProps<
  typeof NeonAuthUIProvider
>["authClient"];

export function NeonAuthProvider({ children }: Props) {
  return (
    <NeonAuthUIProvider
      authClient={authClient as unknown as ProviderAuthClient}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
