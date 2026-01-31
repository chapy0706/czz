// apps/user/app/layout.tsx

import * as React from "react";
import "./globals.css";

import { NeonAuthProvider } from "@/components/providers/neon-auth-ui-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiModeProvider } from "@/components/providers/ui-mode-provider";

import { jaJP } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";

import { AuthUserBadge } from "@/components/auth/auth-user-badge";
import { BeginnerBgmController } from "@/components/beginner/beginner-bgm-controller";
import { BeginnerBottomDock } from "@/components/beginner/beginner-bottom-dock";
import { BeginnerHud } from "@/components/beginner/beginner-hud";
import { BeginnerMascotDock } from "@/components/beginner/beginner-mascot-dock";
import { GlobalBreadcrumbs } from "@/components/nav/global-breadcrumbs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        {/* Clerk のUIを日本語化 */}
        <ClerkProvider localization={jaJP}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {/* NeonAuth は移行中なら残してOK。ただし最終的にはClerkへ寄せると混乱が減る */}
            <NeonAuthProvider>
              <UiModeProvider>
                {/* 常時表示（Linux風のパス表現） */}
                <GlobalBreadcrumbs />

                {children}

                {/* 右上：ログイン中バッジ（ドラッグで移動可） */}
                <AuthUserBadge />

                {/* 初心者モード：固定UIはドックで集約して干渉を防ぐ */}
                <BeginnerBottomDock
                  left={<BeginnerMascotDock />}
                  right={<BeginnerHud />}
                />
                <BeginnerBgmController />
              </UiModeProvider>
            </NeonAuthProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
