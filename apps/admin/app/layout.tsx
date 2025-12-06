// apps/admin/app/layout.tsx
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
// グローバルCSSの場所に応じてパスは調整してください
//import "@/styles/globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "czz Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
