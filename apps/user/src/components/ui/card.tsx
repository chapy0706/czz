// apps/user/src/components/ui/card.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, DivProps>(function Card(
	{ className, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(
				"rounded-xl border bg-background text-foreground shadow-sm",
				className,
			)}
			{...props}
		/>
	);
});

const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(
	function CardHeader({ className, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn("flex flex-col gap-1.5 p-6", className)}
				{...props}
			/>
		);
	},
);

const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
	return (
		<h3
			ref={ref as unknown as React.RefObject<HTMLHeadingElement>}
			className={cn(
				"text-lg font-semibold leading-none tracking-tight",
				className,
			)}
			{...props}
		/>
	);
});

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
	return (
		<p
			ref={ref}
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
});

const CardContent = React.forwardRef<HTMLDivElement, DivProps>(
	function CardContent({ className, ...props }, ref) {
		return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
	},
);

const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(
	function CardFooter({ className, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn("flex items-center p-6 pt-0", className)}
				{...props}
			/>
		);
	},
);

export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
