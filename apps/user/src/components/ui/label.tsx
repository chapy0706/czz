// apps/user/src/components/ui/label.tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Generic Label component.
 *
 * Note:
 * Biome's a11y rule `noLabelWithoutControl` is a static check and can't reliably
 * understand that consumer code will associate this label with a control via:
 * - htmlFor/id, or
 * - nesting an input inside the label
 *
 * So we suppress the rule at the element level.
 */
export const Label = React.forwardRef<
	HTMLLabelElement,
	React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: This component is a generic wrapper; association is handled by consumers via htmlFor/id or nesting.
		<label
			ref={ref}
			className={cn(
				"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
				className,
			)}
			{...props}
		>
			{children}
		</label>
	);
});

Label.displayName = "Label";
