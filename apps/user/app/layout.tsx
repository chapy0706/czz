// apps/user/app/layout.tsx

import * as React from "react";
import "./globals.css";

import { NeonAuthProvider } from "@/components/providers/neon-auth-ui-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiModeProvider } from "@/components/providers/ui-mode-provider";

import { AuthUserBadge } from "@/components/auth/auth-user-badge";
import { BeginnerBgmController } from "@/components/beginner/beginner-bgm-controller";
import { BeginnerHud } from "@/components/beginner/beginner-hud";
import { BeginnerMascotDock } from "@/components/beginner/beginner-mascot-dock";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NeonAuthProvider>
            <UiModeProvider>
              {children}

              {/* logged-in badge */}
              <AuthUserBadge />

              {/* beginner mode UI */}
              <BeginnerMascotDock />
              <BeginnerHud />
              <BeginnerBgmController />
            </UiModeProvider>
          </NeonAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
