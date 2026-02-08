// apps/user/src/components/ui/separator.tsx
import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
	orientation?: "horizontal" | "vertical";
	decorative?: boolean;
};

function Separator({
	orientation = "horizontal",
	decorative = true,
	className,
	...props
}: Props) {
	const base = orientation === "horizontal" ? "h-px w-full" : "h-full w-px";

	// decorative=true は装飾扱い（スクリーンリーダーに読ませない）
	// decorative=false は role=separator を付与
	const a11yProps = decorative
		? { "aria-hidden": true }
		: { role: "separator", "aria-orientation": orientation };

	return (
		<div
			{...a11yProps}
			className={`${base} shrink-0 bg-border ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

export { Separator };
