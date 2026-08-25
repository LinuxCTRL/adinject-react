"use client";

import type React from "react";
import { forwardRef } from "react";

export interface AdSlotFrameProps extends React.HTMLAttributes<HTMLElement> {
	/** Accessible label for assistive technology (default: "Advertisement" or "Sponsored product") */
	a11yLabel?: string;
	/** Landmark role (default: "complementary") */
	a11yRole?: "complementary" | "region" | "none";
	/** HTML container tag to render (default: "aside") */
	as?: "aside" | "div" | "section";
	/** Reserved minHeight for zero CLS */
	minHeight?: number | string;
	/** Reserved aspectRatio for zero CLS */
	aspectRatio?: string;
	/** Extra class names */
	className?: string;
	/** Inline styles */
	style?: React.CSSProperties;
	children: React.ReactNode;
}

/**
 * AdSlotFrame
 * Unified IAB-compliant accessible container for ads and affiliate cards.
 * Ensures landmark announcements, skip-friendly keyboard navigation (not focus-trapping),
 * zero CLS space reservation, and respects prefers-reduced-motion.
 */
export const AdSlotFrame = forwardRef<HTMLElement, AdSlotFrameProps>(
	(
		{
			a11yLabel = "Advertisement",
			a11yRole = "complementary",
			as: Component = "aside",
			minHeight,
			aspectRatio,
			className = "",
			style,
			children,
			...rest
		},
		ref,
	) => {
		const combinedStyle: React.CSSProperties = {
			minHeight,
			aspectRatio,
			position: "relative",
			boxSizing: "border-box",
			...style,
		};

		const roleAttr =
			a11yRole !== "none" && Component === "div" ? a11yRole : undefined;

		return (
			<Component
				ref={ref as React.Ref<never>}
				role={roleAttr}
				aria-label={a11yLabel}
				tabIndex={-1} // Skip-friendly: prevents empty container from trapping keyboard tab focus
				className={`adinject-slot-frame transition-opacity motion-reduce:transition-none ${className}`}
				style={combinedStyle}
				{...rest}
			>
				{children}
			</Component>
		);
	},
);

AdSlotFrame.displayName = "AdSlotFrame";
