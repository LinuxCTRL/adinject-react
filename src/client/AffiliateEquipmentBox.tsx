"use client";

import type React from "react";
import type { AffiliateClickEvent, AffiliateProduct } from "../types";
import { AffiliateCard } from "./AffiliateCard";

export interface AffiliateEquipmentBoxProps {
	title?: string;
	subtitle?: string;
	products: AffiliateProduct[];
	columns?: 1 | 2 | 3 | 4;
	variant?: "compact" | "card" | "horizontal";
	disclosureText?: string;
	className?: string;
	style?: React.CSSProperties;
	onAffiliateClick?: (event: AffiliateClickEvent) => void;
}

/**
 * AffiliateEquipmentBox
 * A structured container for recipe equipment, kitchen tools, gear lists, and ingredient shopping lists.
 */
export function AffiliateEquipmentBox({
	title = "Tools & Equipment Used",
	subtitle = "Tested and recommended for best results in this recipe.",
	products,
	columns = 2,
	variant = "compact",
	disclosureText = "We may earn an affiliate commission when you buy through links on our site.",
	className = "",
	style,
	onAffiliateClick,
}: AffiliateEquipmentBoxProps) {
	if (!products || products.length === 0) return null;

	const getGridColsClass = () => {
		if (variant === "horizontal") return "grid-cols-1";
		if (columns === 1) return "grid-cols-1";
		if (columns === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
		if (columns === 4)
			return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
		return "grid-cols-1 sm:grid-cols-2";
	};

	return (
		<div
			className={`adinject-equipment-box rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs my-6 ${className}`}
			style={style}
		>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/40">
				<div>
					<div className="flex items-center gap-2">
						<span className="text-primary text-base">🍳</span>
						<h3 className="text-base font-bold text-foreground">{title}</h3>
					</div>
					{subtitle && (
						<p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
					)}
				</div>

				<span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-muted-foreground self-start sm:self-auto">
					{products.length} {products.length === 1 ? "Item" : "Items"}
				</span>
			</div>

			{/* Grid of items */}
			<div className={`grid ${getGridColsClass()} gap-3 pt-4`}>
				{products.map((product) => (
					<AffiliateCard
						key={product.id}
						product={product}
						variant={variant}
						placement="equipment-box"
						onAffiliateClick={onAffiliateClick}
					/>
				))}
			</div>

			{/* Footer Disclosure */}
			{disclosureText && (
				<div className="pt-4 mt-4 border-t border-border/40 text-[11px] text-muted-foreground/80 flex items-center justify-between gap-2">
					<span>{disclosureText}</span>
					<span className="text-[10px] font-mono opacity-60">
						AdInject Affiliate
					</span>
				</div>
			)}
		</div>
	);
}
