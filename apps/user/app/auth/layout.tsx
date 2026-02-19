// apps/user/app/auth/layout.tsx
import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

export default function Layout({ children }: Props) {
	return (
		<main className="flex min-h-dvh items-center justify-center px-2">
			<div className="mx-auto w-full max-w-[420px] space-y-6">{children}</div>
		</main>
	);
}
