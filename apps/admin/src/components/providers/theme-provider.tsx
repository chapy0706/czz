// apps/admin/src/components/providers/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="dark" // しばらくは暗めスタートにしておく
			enableSystem={true}
			disableTransitionOnChange
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
