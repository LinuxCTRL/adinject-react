"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

export interface UseAdMetricsOptions {
	/** Intersection threshold (default 0.5 for IAB standard 50% in-view) */
	threshold?: number;
	/** Minimum continuous time in ms to count as viewable (default 1000ms) */
	viewableTimeMs?: number;
	/** Whether to filter out bot / automated headless browser traffic (default: true) */
	filterInvalidTraffic?: boolean;
	onViewable?: () => void;
	onImpression?: () => void;
}

export interface UseAdMetricsReturn {
	ref: React.RefObject<HTMLDivElement | null>;
	isIntersecting: boolean;
	isViewable: boolean;
	viewableDurationMs: number;
	isBotDetected: boolean;
}

/**
 * Checks for obvious headless browser automation flags (IVT Guard)
 */
function isAutomatedBot(): boolean {
	if (typeof window === "undefined" || typeof navigator === "undefined")
		return false;
	if (navigator.webdriver) return true;
	const userAgent = navigator.userAgent || "";
	if (/bot|crawler|spider|headlesschrome|phantomjs/i.test(userAgent))
		return true;
	return false;
}

/**
 * useAdMetrics
 * Real-time IAB-compliant ad viewability and impression tracking hook using IntersectionObserver.
 * Triggers viewability when at least 50% of the ad slot is in view for >= 1 second.
 * Includes Invalid Traffic (IVT) bot filtering to protect network standing.
 */
export function useAdMetrics(
	options: UseAdMetricsOptions = {},
): UseAdMetricsReturn {
	const {
		threshold = 0.5,
		viewableTimeMs = 1000,
		filterInvalidTraffic = true,
		onViewable,
		onImpression,
	} = options;

	const ref = useRef<HTMLDivElement | null>(null);
	const [isIntersecting, setIsIntersecting] = useState(false);
	const [isViewable, setIsViewable] = useState(false);
	const [viewableDurationMs, setViewableDurationMs] = useState(0);
	const [isBotDetected, setIsBotDetected] = useState(false);

	const impressionTriggeredRef = useRef(false);
	const viewableTriggeredRef = useRef(false);
	const startTimeRef = useRef<number | null>(null);

	useEffect(() => {
		const element = ref.current;
		if (
			!element ||
			typeof window === "undefined" ||
			!("IntersectionObserver" in window)
		) {
			return;
		}

		if (filterInvalidTraffic && isAutomatedBot()) {
			setIsBotDetected(true);
			return;
		}

		let intervalTimer: ReturnType<typeof setInterval> | null = null;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;

				const inView =
					entry.isIntersecting && entry.intersectionRatio >= threshold;
				setIsIntersecting(inView);

				if (inView) {
					// 1. Fire impression on first view
					if (!impressionTriggeredRef.current) {
						impressionTriggeredRef.current = true;
						onImpression?.();
					}

					startTimeRef.current = Date.now();
					intervalTimer = setInterval(() => {
						if (startTimeRef.current) {
							const elapsed = Date.now() - startTimeRef.current;
							setViewableDurationMs(elapsed);

							if (elapsed >= viewableTimeMs && !viewableTriggeredRef.current) {
								viewableTriggeredRef.current = true;
								setIsViewable(true);
								onViewable?.();
							}
						}
					}, 200);
				} else {
					if (intervalTimer) clearInterval(intervalTimer);
					startTimeRef.current = null;
				}
			},
			{ threshold: [0, threshold, 1] },
		);

		observer.observe(element);

		return () => {
			if (intervalTimer) clearInterval(intervalTimer);
			observer.disconnect();
		};
	}, [
		threshold,
		viewableTimeMs,
		filterInvalidTraffic,
		onViewable,
		onImpression,
	]);

	return {
		ref,
		isIntersecting,
		isViewable,
		viewableDurationMs,
		isBotDetected,
	};
}
