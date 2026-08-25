"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
	AdConsentFallback,
	AdDimensions,
	AdFormat,
	AdStatus,
	FallbackBanner,
} from "../types";
import { AdFallback } from "./AdFallback";
import { useAdInject } from "./AdInjectProvider";
import { AdSlotFrame } from "./AdSlotFrame";
import { useConsent } from "./ConsentProvider";

// Global declaration for Google AdSense array
declare global {
	interface Window {
		adsbygoogle?: Array<Record<string, unknown>>;
	}
}

export interface AdSenseSlotProps {
	/** Google AdSense client ID (e.g. "ca-pub-1234567890123456"). Inherits from AdInjectProvider if omitted. */
	client?: string;
	/** Ad slot ID (e.g. "9876543210") */
	slot: string;
	format?: AdFormat;
	responsive?: boolean;
	layoutKey?: string;
	dimensions?: AdDimensions;
	fallback?: FallbackBanner;
	testMode?: boolean;
	lazyLoad?: boolean;
	debug?: boolean;
	consentFallback?: AdConsentFallback;
	/** Accessible label for assistive tech (default: "Advertisement") */
	a11yLabel?: string;
	/** IAB Content Taxonomy 3.0 category code (e.g. "IAB8-5") */
	contentCategory?: string;
	className?: string;
	style?: React.CSSProperties;
	onStatusChange?: (status: AdStatus) => void;
}

const DEFAULT_DIMENSIONS: Record<AdFormat, AdDimensions> = {
	rectangle: { minHeight: 250, aspectRatio: "300/250" },
	horizontal: { minHeight: 90, aspectRatio: "728/90" },
	vertical: { minHeight: 600, aspectRatio: "160/600" },
	fluid: { minHeight: 250 },
	auto: { minHeight: 250 },
	custom: { minHeight: 250 },
};

/**
 * AdSenseSlot
 * Next-generation AdSense React component guaranteeing zero Cumulative Layout Shift (CLS),
 * lazy loading via IntersectionObserver, context inheritance, and unfilled / adblock fallback banners.
 */
export function AdSenseSlot({
	client,
	slot,
	format = "auto",
	responsive = true,
	layoutKey,
	dimensions,
	fallback,
	testMode,
	lazyLoad = true,
	debug = false,
	consentFallback = "affiliate",
	a11yLabel = "Advertisement",
	contentCategory,
	className = "",
	style,
	onStatusChange,
}: AdSenseSlotProps) {
	const adInjectContext = useAdInject();
	const effectiveClient = client || adInjectContext.client || "ca-pub-XXXXXXXX";
	const effectiveTestMode = testMode ?? adInjectContext.testMode ?? false;
	const effectiveFallback = fallback || adInjectContext.defaultFallback;
	const effectiveCategory = contentCategory || adInjectContext.contentCategory;

	const containerRef = useRef<HTMLElement>(null);
	const isPushedRef = useRef(false);
	const [status, setStatus] = useState<AdStatus>("idle");
	const [isVisible, setIsVisible] = useState(!lazyLoad);

	const effectiveDimensions = {
		...DEFAULT_DIMENSIONS[format],
		...dimensions,
	};

	const updateStatus = useCallback(
		(newStatus: AdStatus) => {
			setStatus(newStatus);
			onStatusChange?.(newStatus);
		},
		[onStatusChange],
	);

	const { status: consentStatus } = useConsent();
	const isConsentGranted = consentStatus === "granted";

	// 1. IntersectionObserver for zero-jank lazy loading
	useEffect(() => {
		if (!lazyLoad) {
			setIsVisible(true);
			return;
		}

		const element = containerRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "300px 0px" },
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [lazyLoad]);

	// 2. Safe Google adsbygoogle.push() execution (only when consent is granted)
	useEffect(() => {
		if (!isVisible || isPushedRef.current || !isConsentGranted) return;

		if (effectiveTestMode) {
			updateStatus("rendered");
			isPushedRef.current = true;
			return;
		}

		updateStatus("loading");

		const pushTimer = setTimeout(() => {
			try {
				if (typeof window !== "undefined") {
					window.adsbygoogle = window.adsbygoogle || [];
					window.adsbygoogle.push({});
					isPushedRef.current = true;
					updateStatus("rendered");
				}
			} catch (err) {
				console.warn("[AdInject] adsbygoogle.push error:", err);
				updateStatus("error");
			}
		}, 50);

		return () => clearTimeout(pushTimer);
	}, [isVisible, effectiveTestMode, updateStatus, isConsentGranted]);

	// 3. Fallback unfill detection check
	useEffect(() => {
		if (effectiveTestMode || !isPushedRef.current) return;

		const checkTimer = setTimeout(() => {
			const el = containerRef.current?.querySelector(".adsbygoogle");
			if (el) {
				const adStatus = el.getAttribute("data-ad-status");
				if (adStatus === "unfilled" || el.innerHTML.trim() === "") {
					updateStatus("unfilled");
				}
			}
		}, 2500);

		return () => clearTimeout(checkTimer);
	}, [effectiveTestMode, updateStatus]);

	// 4. Dev-Mode CLS Regression Guard
	useEffect(() => {
		if (
			process.env.NODE_ENV === "production" ||
			effectiveTestMode ||
			!isPushedRef.current
		)
			return;

		const clsCheckTimer = setTimeout(() => {
			const insEl = containerRef.current?.querySelector(".adsbygoogle");
			if (insEl && insEl.clientHeight > 0) {
				const reservedHeight =
					typeof effectiveDimensions.minHeight === "number"
						? effectiveDimensions.minHeight
						: Number.parseInt(String(effectiveDimensions.minHeight), 10);
				const diff = Math.abs(insEl.clientHeight - reservedHeight);
				if (diff > 40) {
					console.warn(
						`[AdInject CLS Guard] Ad slot #${slot} rendered at ${insEl.clientHeight}px but reserved ${reservedHeight}px (deviation: ${diff}px). Adjust dimensions prop to prevent Cumulative Layout Shift (CLS).`,
					);
				}
			}
		}, 3500);

		return () => clearTimeout(clsCheckTimer);
	}, [effectiveTestMode, slot, effectiveDimensions.minHeight]);

	const containerStyle: React.CSSProperties = {
		width: "100%",
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		...style,
	};

	return (
		<AdSlotFrame
			ref={containerRef}
			a11yLabel={a11yLabel}
			minHeight={effectiveDimensions.minHeight}
			aspectRatio={effectiveDimensions.aspectRatio}
			className={`adinject-slot-container ${className}`}
			style={containerStyle}
			data-adinject-slot={slot}
			data-adinject-status={status}
			data-adinject-category={effectiveCategory}
		>
			{/* Test Mode Mock UI */}
			{effectiveTestMode && (
				<div
					style={{
						width: "100%",
						height: "100%",
						minHeight: effectiveDimensions.minHeight,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: "16px",
						border: "1px dashed rgba(var(--primary-rgb, 59, 130, 246), 0.3)",
						borderRadius: "12px",
						backgroundColor: "rgba(var(--primary-rgb, 59, 130, 246), 0.03)",
						textAlign: "center",
						boxSizing: "border-box",
					}}
				>
					<div
						style={{
							fontSize: "11px",
							fontWeight: 600,
							color: "var(--primary, #3b82f6)",
							marginBottom: "4px",
						}}
					>
						● Google AdSense Test Slot
					</div>
					<div
						style={{
							fontSize: "10px",
							fontFamily: "monospace",
							opacity: 0.7,
						}}
					>
						Slot: {slot} | Format: {format}
					</div>
					<div
						style={{
							fontSize: "9px",
							opacity: 0.5,
							marginTop: "4px",
						}}
					>
						Zero CLS Reserved: {effectiveDimensions.minHeight}px
					</div>
				</div>
			)}

			{/* Consent Denied / Pending Fallback */}
			{!effectiveTestMode && !isConsentGranted && (
				<div style={{ width: "100%" }}>
					{consentFallback === "affiliate" && effectiveFallback ? (
						<AdFallback fallback={effectiveFallback} />
					) : typeof consentFallback !== "string" && consentFallback ? (
						consentFallback
					) : (
						<div
							style={{
								width: "100%",
								height: "100%",
								minHeight: effectiveDimensions.minHeight,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								padding: "16px",
								borderRadius: "12px",
								backgroundColor: "rgba(0, 0, 0, 0.02)",
								border: "1px dashed rgba(0, 0, 0, 0.1)",
								textAlign: "center",
								boxSizing: "border-box",
							}}
						>
							<div
								style={{
									fontSize: "11px",
									fontWeight: 500,
									opacity: 0.6,
									marginBottom: "2px",
								}}
							>
								Consent Required for Personalized Ads
							</div>
							<div style={{ fontSize: "10px", opacity: 0.4 }}>
								Zero CLS Reserved: {effectiveDimensions.minHeight}px
							</div>
						</div>
					)}
				</div>
			)}

			{/* Fallback Banner on Unfilled / Error (when consent is granted) */}
			{!effectiveTestMode &&
				isConsentGranted &&
				(status === "unfilled" || status === "error") &&
				effectiveFallback && (
					<div style={{ width: "100%" }}>
						<AdFallback fallback={effectiveFallback} />
					</div>
				)}

			{/* Live Google AdSense Ins Tag (only when consent is granted) */}
			{!effectiveTestMode && isConsentGranted && (
				<ins
					className="adsbygoogle"
					style={{
						display: "block",
						width: "100%",
						height: "100%",
						minHeight: effectiveDimensions.minHeight,
					}}
					data-ad-client={effectiveClient}
					data-ad-slot={slot}
					data-ad-format={format}
					data-full-width-responsive={responsive ? "true" : "false"}
					data-ad-layout-key={layoutKey}
				/>
			)}
		</AdSlotFrame>
	);
}
