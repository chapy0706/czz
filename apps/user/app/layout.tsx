// apps/user/app/layout.tsx

import type { Metadata } from "next";
import Script from "next/script";
import type * as React from "react";
import "./globals.css";

import { jaJP } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthUserBadge } from "@/components/auth/auth-user-badge";
import { BeginnerBgmController } from "@/components/beginner/beginner-bgm-controller";
import { BeginnerMascotDock } from "@/components/beginner/beginner-mascot-dock";
import { GlobalBreadcrumbs } from "@/components/nav/global-breadcrumbs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiModeProvider } from "@/components/providers/ui-mode-provider";

export const metadata: Metadata = {
	title: "czz",
	description: "DSLでUNIX哲学を学ぶゲーム",
	icons: {
		icon: [
			{ url: "/assets/characters/favicon.ico" },
			{
				url: "/assets/characters/favicon-32.png",
				sizes: "32x32",
				type: "image/png",
			},
		],
		apple: [
			{
				url: "/assets/characters/czz-180.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	},
};

const FEATURES = {
	themeProvider: true,
	uiModeProvider: true,

	breadcrumbs: true,
	authUserBadge: true,

	beginnerDock: true,
	beginnerBgm: true,
} as const;

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const app = (
		<>
			{FEATURES.breadcrumbs ? <GlobalBreadcrumbs /> : null}

			{children}

			{FEATURES.authUserBadge ? <AuthUserBadge /> : null}

			{FEATURES.beginnerDock ? <BeginnerMascotDock /> : null}

			{FEATURES.beginnerBgm ? <BeginnerBgmController /> : null}
		</>
	);

	const withUiMode = FEATURES.uiModeProvider ? (
		<UiModeProvider>{app}</UiModeProvider>
	) : (
		app
	);

	const withTheme = FEATURES.themeProvider ? (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			{withUiMode}
		</ThemeProvider>
	) : (
		withUiMode
	);

	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				{/* Cloudflare Web Analytics */}
				<Script
					src="https://static.cloudflareinsights.com/beacon.min.js"
					strategy="afterInteractive"
					data-cf-beacon='{"token": "3a5052f48b5c43b5bc3b3b45d4bcc599"}'
				/>
			</head>
			<body>
				<ClerkProvider
					localization={jaJP}
					signInUrl="/auth/sign-in"
					signUpUrl="/auth/sign-up"
					afterSignOutUrl="/"
				>
					{withTheme}
				</ClerkProvider>
			</body>
		</html>
	);
}
