"use client";

import { useMemo } from "react";
import { injectHtmlAds } from "../transformers/html-inserter";
import { injectMarkdownAds } from "../transformers/markdown-inserter";
import type {
	AdDimensions,
	AdFormat,
	AdUnit,
	FallbackBanner,
	PlacementRule,
} from "../types";
import { useAdInject } from "./AdInjectProvider";
import { AdSenseSlot } from "./AdSenseSlot";

export interface InArticleAdsProps {
	/** Raw HTML article body string */
	html?: string;
	/** Raw Markdown article body string */
	markdown?: string;
	/** Number of paragraphs between ads (default: 3) */
	interval?: number;
	/** Minimum paragraphs before the first ad (default: 1) */
	startOffset?: number;
	/** Maximum total ads injected in the article (default: 4) */
	maxAds?: number;
	/** AdSense slot ID (inherits client from AdInjectProvider) */
	slot?: string;
	/** Custom ad unit override */
	adUnit?: AdUnit;
	/** Custom ad dimensions */
	dimensions?: AdDimensions;
	/** Ad format (default: "fluid" or "rectangle") */
	format?: AdFormat;
	/** Fallback banner for unfill / adblock */
	fallback?: FallbackBanner;
	/** IAB Content Taxonomy category */
	contentCategory?: string;
	/** Test mode toggle */
	testMode?: boolean;
	/** Custom container class */
	className?: string;
}

/**
 * InArticleAds
 * High-level declarative React component for in-article ad spacing.
 * Automatically inserts zero-CLS responsive ad slots between paragraphs of HTML or Markdown.
 */
export function InArticleAds({
	html,
	markdown,
	interval = 3,
	startOffset = 1,
	maxAds = 4,
	slot,
	adUnit,
	dimensions,
	format = "fluid",
	fallback,
	contentCategory,
	testMode,
	className = "",
}: InArticleAdsProps) {
	const adInjectContext = useAdInject();
	const effectiveSlot = slot || adUnit?.slot || "0000000000";
	const effectiveClient =
		adUnit?.client || adInjectContext.client || "ca-pub-XXXXXXXX";
	const effectiveTestMode =
		testMode ?? adUnit?.testMode ?? adInjectContext.testMode ?? false;
	const effectiveFallback =
		fallback || adUnit?.fallback || adInjectContext.defaultFallback;
	const effectiveCategory =
		contentCategory ||
		adUnit?.contentCategory ||
		adInjectContext.contentCategory;

	// Process HTML or Markdown with injected placeholder markers
	const transformedHtml = useMemo(() => {
		const targetAdUnit: AdUnit = adUnit || {
			id: `unit-in-article-${effectiveSlot}`,
			name: "In-Article Ad Unit",
			client: effectiveClient,
			slot: effectiveSlot,
			format,
			responsive: true,
			testMode: effectiveTestMode,
			fallback: effectiveFallback,
			contentCategory: effectiveCategory,
		};

		const rule: PlacementRule = {
			id: "rule-in-article",
			name: "In-Article Spacing",
			enabled: true,
			deviceFilter: "all" as const,
			paragraphInterval: interval,
			minWordsBeforeFirstAd: startOffset * 10,
			minParagraphsTotal: startOffset + 1,
			maxAdsPerArticle: maxAds,
			adUnitId: targetAdUnit.id,
		};

		if (html) {
			const result = injectHtmlAds({
				html,
				rule,
				adUnit: targetAdUnit,
				placeholderTemplate: (slot) => `<!-- ADINJECT_SLOT_${slot.index} -->`,
			});
			return result.content;
		}

		if (markdown) {
			const result = injectMarkdownAds({
				markdown,
				rule,
				adUnit: targetAdUnit,
				customAdMarker: (slot) => `<!-- ADINJECT_SLOT_${slot.index} -->`,
			});
			return result.content;
		}

		return "";
	}, [
		html,
		markdown,
		interval,
		startOffset,
		maxAds,
		adUnit,
		effectiveSlot,
		effectiveClient,
		format,
		effectiveTestMode,
		effectiveFallback,
		effectiveCategory,
	]);

	// Split by ad markers for clean React component rendering
	const segments = useMemo(() => {
		if (!transformedHtml) return [];
		return transformedHtml.split(/<!-- ADINJECT_SLOT_(\d+) -->/g);
	}, [transformedHtml]);

	if (segments.length <= 1) {
		return (
			<div
				className={`adinject-article-body ${className}`}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: safe transformed article
				dangerouslySetInnerHTML={{ __html: transformedHtml }}
			/>
		);
	}

	return (
		<div className={`adinject-article-body ${className}`}>
			{segments.map((segment, idx) => {
				// Even indices are HTML text, odd indices are ad slot indices
				if (idx % 2 === 1) {
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: deterministic split segments
							key={`article-ad-slot-${segment}-${idx}`}
							className="my-6 w-full"
						>
							<AdSenseSlot
								client={effectiveClient}
								slot={effectiveSlot}
								format={format}
								dimensions={dimensions}
								fallback={effectiveFallback}
								testMode={effectiveTestMode}
								contentCategory={effectiveCategory}
							/>
						</div>
					);
				}

				return (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: deterministic split segments
						key={`article-segment-${idx}`}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: safe transformed article
						dangerouslySetInnerHTML={{ __html: segment }}
					/>
				);
			})}
		</div>
	);
}
