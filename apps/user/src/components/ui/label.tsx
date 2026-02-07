// apps/user/src/components/ui/label.tsx

import { cn } from "@/lib/utils";
import * as React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

/**
 * 依存を増やさないため Radix は使わない。
 * HTML label として必要十分な挙動を提供する。
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
	{ className, children, ...props },
	ref,
) {
	return (
		<label
			ref={ref}
			className={cn(
				"text-sm font-medium leading-none",
				"peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
				className,
			)}
			{...props}
		>
			{children}
		</label>
	);
});

export { Label };
