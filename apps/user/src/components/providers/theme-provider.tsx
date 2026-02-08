// apps/user/src/components/providers/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Props = React.ComponentProps<typeof NextThemesProvider>;

function ThemeProvider({ children, ...props }: Props) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export { ThemeProvider };
	