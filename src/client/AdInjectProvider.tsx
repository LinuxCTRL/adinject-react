"use client";

import type React from "react";
import { createContext, useContext, useMemo } from "react";
import type { AdInjectProjectConfig } from "../api/config-client";
import type { AdUnit, FallbackBanner, PlacementRule } from "../types";

export interface AdInjectContextValue {
	client?: string;
	testMode?: boolean;
	defaultFallback?: FallbackBanner;
	contentCategory?: string;
	config?: AdInjectProjectConfig | null;
	projectId?: string;
	rules: PlacementRule[];
	adUnits: Record<string, AdUnit>;
}

const AdInjectContext = createContext<AdInjectContextValue>({
	rules: [],
	adUnits: {},
});

export interface AdInjectProviderProps {
	/** Default Google AdSense publisher ID (e.g. "ca-pub-1234567890123456") */
	client?: string;
	/** Global test mode toggle for staging/dev */
	testMode?: boolean;
	/** Global default fallback banner when ads are blocked or unfilled */
	defaultFallback?: FallbackBanner;
	/** Global IAB Content Taxonomy category (e.g. "IAB8-5" for Food & Drink) */
	contentCategory?: string;
	/** Optional hosted dashboard project config */
	config?: AdInjectProjectConfig | null;
	/** Project ID if connected to AdInject cloud */
	projectId?: string;
	children: React.ReactNode;
}

/**
 * AdInjectProvider
 * Top-level provider passing down global client defaults, fallback banners,
 * and compiled rules to all child ad components (<AdSenseSlot />, <InArticleAds />, <AdInjectFeed />).
 */
export function AdInjectProvider({
	client,
	testMode,
	defaultFallback,
	contentCategory,
	config,
	projectId,
	children,
}: AdInjectProviderProps) {
	const value = useMemo<AdInjectContextValue>(
		() => ({
			client:
				client ||
				config?.adUnits?.[Object.keys(config?.adUnits || {})[0] || ""]?.client,
			testMode,
			defaultFallback:
				defaultFallback ||
				(config?.adUnits
					? Object.values(config.adUnits).find((u) => u.fallback)?.fallback
					: undefined),
			contentCategory,
			config,
			projectId: projectId || config?.projectId,
			rules: config?.rules || [],
			adUnits: config?.adUnits || {},
		}),
		[client, testMode, defaultFallback, contentCategory, config, projectId],
	);

	return (
		<AdInjectContext.Provider value={value}>
			{children}
		</AdInjectContext.Provider>
	);
}

/**
 * Hook to access active AdInject configuration in client components
 */
export function useAdInject(): AdInjectContextValue {
	return useContext(AdInjectContext);
}
