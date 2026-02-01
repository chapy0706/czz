// apps/user/app/layout.tsx

import * as React from "react";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiModeProvider } from "@/components/providers/ui-mode-provider";

import { AuthUserBadge } from "@/components/auth/auth-user-badge";
import { GlobalBreadcrumbs } from "@/components/nav/global-breadcrumbs";

import { BeginnerBgmController } from "@/components/beginner/beginner-bgm-controller";
import { BeginnerBottomDock } from "@/components/beginner/beginner-bottom-dock";
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
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <UiModeProvider>
              <GlobalBreadcrumbs />

              {children}

              {/* 右上：ログイン状態/ログアウト導線 */}
              <AuthUserBadge />

              {/* 初心者モード系UI（表示条件は各コンポーネント側で制御） */}
              <BeginnerBottomDock
                left={<BeginnerMascotDock />}
                right={<BeginnerHud />}
              />

              <BeginnerBgmController />
            </UiModeProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
