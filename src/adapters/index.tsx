import type React from "react";
import { AdSenseSlot } from "../client/AdSenseSlot";
import type { AdDimensions, AdFormat, FallbackBanner } from "../types";

export interface AdAdapterSlotProps {
	slot: string;
	client?: string;
	format?: AdFormat;
	responsive?: boolean;
	dimensions?: AdDimensions;
	fallback?: FallbackBanner;
	testMode?: boolean;
	/** IAB Content Taxonomy category (e.g. "IAB8-5") */
	contentCategory?: string;
	/** Accessible label override */
	a11yLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}

export interface AdAdapter {
	name: string;
	render: (props: AdAdapterSlotProps) => React.ReactNode;
	loadScript?: () => void | Promise<void>;
}

// Global script load deduplication registry
const loadedScriptAdapters = new Set<string>();

/**
 * Executes a network script loader exactly once per page lifecycle
 */
export function loadScriptOnce(
	adapterName: string,
	loader?: () => void | Promise<void>,
) {
	if (!loader || typeof window === "undefined") return;
	if (loadedScriptAdapters.has(adapterName)) return;

	loadedScriptAdapters.add(adapterName);
	try {
		loader();
	} catch (err) {
		console.warn(
			`[AdInject Adapter: ${adapterName}] Failed to load script:`,
			err,
		);
	}
}

/**
 * Creates a custom ad network adapter
 */
export function createAdAdapter(config: AdAdapter): AdAdapter {
	return {
		name: config.name,
		render: config.render,
		loadScript: config.loadScript,
	};
}

/**
 * Built-in Google AdSense Adapter
 */
export function adsenseAdapter(opts: {
	client: string;
	testMode?: boolean;
}): AdAdapter {
	return createAdAdapter({
		name: "adsense",
		loadScript: () => {
			if (
				document.querySelector('script[src*="pagead2.googlesyndication.com"]')
			)
				return;
			const script = document.createElement("script");
			script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(opts.client)}`;
			script.async = true;
			script.crossOrigin = "anonymous";
			document.head.appendChild(script);
		},
		render: (props: AdAdapterSlotProps) => {
			return (
				<AdSenseSlot
					client={props.client || opts.client}
					slot={props.slot}
					format={props.format}
					responsive={props.responsive}
					dimensions={props.dimensions}
					fallback={props.fallback}
					testMode={props.testMode ?? opts.testMode}
					className={props.className}
					style={props.style}
				/>
			);
		},
	});
}

/**
 * Built-in Google Ad Manager (GAM / GPT) Adapter
 */
export function gamAdapter(opts: {
	networkCode: string;
	testMode?: boolean;
}): AdAdapter {
	return createAdAdapter({
		name: "gam",
		loadScript: () => {
			if (
				document.querySelector('script[src*="securepubads.g.doubleclick.net"]')
			)
				return;
			const script = document.createElement("script");
			script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
			script.async = true;
			document.head.appendChild(script);
		},
		render: (props: AdAdapterSlotProps) => {
			const adUnitPath = `/${opts.networkCode}/${props.slot}`;
			const divId = `gpt-ad-${props.slot.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

			if (props.testMode || opts.testMode) {
				return (
					<aside
						aria-label={props.a11yLabel || "Google Ad Manager Advertisement"}
						className={`adinject-gam-slot ${props.className || ""}`}
						data-adinject-category={props.contentCategory}
						style={{
							minHeight: props.dimensions?.minHeight || "250px",
							border: "1px dashed rgba(59, 130, 246, 0.4)",
							borderRadius: "12px",
							backgroundColor: "rgba(59, 130, 246, 0.03)",
							padding: "16px",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							textAlign: "center",
							fontSize: "11px",
							color: "#2563eb",
							...props.style,
						}}
					>
						<strong>● Google Ad Manager (GAM) Slot</strong>
						<span
							style={{
								fontFamily: "monospace",
								fontSize: "10px",
								opacity: 0.8,
							}}
						>
							{adUnitPath}
						</span>
					</aside>
				);
			}

			return (
				<aside
					id={divId}
					aria-label={props.a11yLabel || "Google Ad Manager Advertisement"}
					className={`adinject-gam-slot ${props.className || ""}`}
					data-adinject-category={props.contentCategory}
					style={{
						minHeight: props.dimensions?.minHeight || "250px",
						width: "100%",
						...props.style,
					}}
				/>
			);
		},
	});
}

/**
 * Built-in Ezoic Adapter
 */
export function ezoicAdapter(opts: {
	siteId: string;
	testMode?: boolean;
}): AdAdapter {
	return createAdAdapter({
		name: "ezoic",
		loadScript: () => {
			if (document.querySelector('script[src*="ezoic.net"]')) return;
			const script = document.createElement("script");
			script.src = `https://g.ezoic.net/ezoic/sa.min.js?siteId=${encodeURIComponent(opts.siteId)}`;
			script.async = true;
			document.head.appendChild(script);
		},
		render: (props: AdAdapterSlotProps) => {
			if (props.testMode || opts.testMode) {
				return (
					<aside
						aria-label={props.a11yLabel || "Ezoic Advertisement"}
						className={`adinject-ezoic-slot ${props.className || ""}`}
						data-adinject-category={props.contentCategory}
						style={{
							minHeight: "250px",
							border: "1px dashed #10b981",
							borderRadius: "12px",
							padding: "16px",
							textAlign: "center",
							fontSize: "11px",
							color: "#059669",
							...props.style,
						}}
					>
						<strong>● Ezoic Ad Placeholder #{props.slot}</strong>
					</aside>
				);
			}

			return (
				<aside
					id={`ezoic-pub-ad-placeholder-${props.slot}`}
					aria-label={props.a11yLabel || "Ezoic Advertisement"}
					className={`adinject-ezoic-slot ${props.className || ""}`}
					data-adinject-category={props.contentCategory}
					style={{ minHeight: "250px", width: "100%", ...props.style }}
				/>
			);
		},
	});
}
