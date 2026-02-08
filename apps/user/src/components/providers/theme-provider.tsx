// apps/user/src/components/providers/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

type Props = Omit<ThemeProviderProps, "children"> & { children: React.ReactNode };

export function ThemeProvider({ children, ...props }: Props) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
