// apps/user/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";

import { AuthUserBadge } from "@/components/auth/auth-user-badge";
import { ModeToggle } from "@/components/providers/mode-toggle";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiModeProvider } from "@/components/providers/ui-mode-provider";

export const metadata: Metadata = {
  title: "czz",
  description: "Instruction Builder Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <UiModeProvider>
              <div className="fixed top-3 right-3 z-40 flex gap-2">
                <ModeToggle />
                <AuthUserBadge />
              </div>
              {children}
            </UiModeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
