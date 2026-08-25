"use client";

import type React from "react";
import { useState } from "react";
import type { AffiliateDisclosureVariant } from "../types";

export interface AffiliateDisclosureProps {
	variant?: AffiliateDisclosureVariant;
	preset?: "standard" | "amazon" | "custom";
	customText?: string;
	policyUrl?: string;
	collapsible?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

const PRESET_TEXTS: Record<"standard" | "amazon", string> = {
	standard:
		"This post may contain affiliate links. If you make a purchase through these links, we may earn a small commission at no additional cost to you.",
	amazon:
		"As an Amazon Associate, we earn from qualifying purchases. Product prices and availability are accurate as of the date/time indicated and are subject to change.",
};

export function AffiliateDisclosure({
	variant = "banner",
	preset = "standard",
	customText,
	policyUrl,
	collapsible = false,
	className = "",
	style,
}: AffiliateDisclosureProps) {
	const [isOpen, setIsOpen] = useState(!collapsible);
	const text =
		customText ||
		(preset === "custom" ? PRESET_TEXTS.standard : PRESET_TEXTS[preset]);

	// 1. Inline Variant
	if (variant === "inline") {
		return (
			<span
				className={`adinject-disclosure-inline text-[11px] text-muted-foreground/90 italic ${className}`}
				style={style}
			>
				*{text}
				{policyUrl && (
					<a
						href={policyUrl}
						aria-label="Learn more about our affiliate disclosure policy"
						className="ml-1.5 underline hover:text-foreground transition-colors"
					>
						Learn more
					</a>
				)}
			</span>
		);
	}

	// 2. Compact Variant (Subtle Pill / Badge)
	if (variant === "compact") {
		return (
			<div
				className={`adinject-disclosure-compact inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/60 text-[11px] text-muted-foreground ${className}`}
				style={style}
			>
				<span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
				<span>{text}</span>
				{policyUrl && (
					<a
						href={policyUrl}
						aria-label="Read our full affiliate disclosure policy"
						className="font-medium underline hover:text-foreground ml-1"
					>
						Disclosure
					</a>
				)}
			</div>
		);
	}

	// 3. Footer Variant
	if (variant === "footer") {
		return (
			<aside
				aria-label="Affiliate Disclosure"
				className={`adinject-disclosure-footer border-t border-border/40 pt-4 mt-8 text-xs text-muted-foreground/80 ${className}`}
				style={style}
			>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<p className="leading-relaxed m-0">{text}</p>
					{policyUrl && (
						<a
							href={policyUrl}
							className="text-primary hover:underline font-medium shrink-0"
						>
							Affiliate Policy →
						</a>
					)}
				</div>
			</aside>
		);
	}

	// 4. Banner Variant (Default Alert Box)
	return (
		<div
			role="note"
			aria-label="Affiliate Disclaimer"
			className={`adinject-disclosure-banner rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-950 dark:text-amber-200/90 shadow-2xs my-4 ${className}`}
			style={style}
		>
			<div className="flex items-start gap-2.5">
				<span className="text-amber-500 text-sm shrink-0">ⓘ</span>
				<div className="flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="font-semibold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
							Affiliate Disclosure
						</span>
						{collapsible && (
							<button
								type="button"
								onClick={() => setIsOpen(!isOpen)}
								className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer bg-transparent border-0 p-0"
							>
								{isOpen ? "Hide" : "Show"}
							</button>
						)}
					</div>

					{isOpen && (
						<p className="mt-1 leading-relaxed text-muted-foreground dark:text-amber-200/80 m-0">
							{text}{" "}
							{policyUrl && (
								<a
									href={policyUrl}
									className="underline hover:text-foreground font-medium"
								>
									Read our full affiliate disclosure.
								</a>
							)}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
