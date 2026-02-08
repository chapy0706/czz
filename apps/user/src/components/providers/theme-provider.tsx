// apps/user/src/components/providers/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

type Props = React.PropsWithChildren<
	React.ComponentProps<typeof NextThemesProvider>
>;

function ThemeProvider({ children, ...props }: Props) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export { ThemeProvider };
