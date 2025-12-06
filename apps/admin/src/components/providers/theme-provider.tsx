// apps/admin/src/components/providers/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

export type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"      // しばらくは暗めスタートにしておく
      enableSystem={true}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
