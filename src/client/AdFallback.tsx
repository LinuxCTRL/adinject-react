import type { FallbackBanner } from "../types";

export interface AdFallbackProps {
	fallback: FallbackBanner;
	className?: string;
}

/**
 * AdFallback
 * Renders an affiliate product card, custom CTA, or banner when AdSense is unfilled or blocked.
 */
export function AdFallback({ fallback, className = "" }: AdFallbackProps) {
	if (fallback.type === "html" && fallback.htmlContent) {
		return (
			<div
				className={`adinject-fallback-html ${className}`}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: user configured fallback
				dangerouslySetInnerHTML={{ __html: fallback.htmlContent }}
			/>
		);
	}

	return (
		<a
			href={fallback.targetUrl}
			target="_blank"
			rel="noopener noreferrer sponsored"
			aria-label={
				fallback.title
					? `Advertisement: ${fallback.title}`
					: "Sponsored Advertisement"
			}
			className={`group relative flex flex-col md:flex-row items-center gap-4 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 via-card to-background p-4 text-card-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-md ${className}`}
			style={{ textDecoration: "none" }}
		>
			{fallback.imageUrl && (
				<div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={fallback.imageUrl}
						alt={fallback.altText || fallback.title || "Sponsored"}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				</div>
			)}

			<div className="flex-1 space-y-1.5 text-left">
				{fallback.badgeText && (
					<span
						style={{
							display: "inline-block",
							fontSize: "10px",
							padding: "2px 8px",
							borderRadius: "9999px",
							fontWeight: 600,
							backgroundColor: "rgba(var(--primary-rgb, 59, 130, 246), 0.1)",
							color: "var(--primary, #3b82f6)",
							border: "1px solid rgba(var(--primary-rgb, 59, 130, 246), 0.2)",
						}}
					>
						{fallback.badgeText}
					</span>
				)}

				{fallback.title && (
					<h4
						style={{
							fontSize: "14px",
							fontWeight: 700,
							margin: "4px 0",
							color: "inherit",
						}}
					>
						{fallback.title}
					</h4>
				)}

				{fallback.description && (
					<p
						style={{
							fontSize: "12px",
							margin: 0,
							opacity: 0.8,
							lineHeight: 1.4,
						}}
					>
						{fallback.description}
					</p>
				)}
			</div>

			{fallback.ctaText && (
				<div className="shrink-0">
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "4px",
							padding: "6px 12px",
							fontSize: "12px",
							fontWeight: 600,
							borderRadius: "8px",
							backgroundColor: "var(--primary, #3b82f6)",
							color: "#ffffff",
						}}
					>
						{fallback.ctaText} →
					</span>
				</div>
			)}
		</a>
	);
}
