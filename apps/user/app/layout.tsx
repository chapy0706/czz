import { BeginnerMascotDock } from "@/components/beginner/beginner-mascot-dock";
import { NeonAuthProvider } from "@/components/providers/neon-auth-ui-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiModeProvider } from "@/components/providers/ui-mode-provider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "czz User",
};

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
              <BeginnerMascotDock />
            </UiModeProvider>
          </NeonAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
