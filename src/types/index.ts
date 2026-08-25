import type React from "react";

/**
 * AdInject Core Type Definitions
 */

export type AdFormat =
	| "auto"
	| "rectangle" // 300x250, 336x280
	| "horizontal" // 728x90, 970x90, 320x50
	| "vertical" // 160x600, 300x600
	| "fluid" // in-article / in-feed native
	| "custom";

export interface AdDimensions {
	width?: number | string;
	height?: number | string;
	minHeight?: number | string;
	aspectRatio?: string;
}

export type AdDeviceFilter = "all" | "mobile" | "desktop";

export interface FallbackBanner {
	id: string;
	name: string;
	type: "image" | "html" | "custom_cta";
	targetUrl: string;
	imageUrl?: string;
	altText?: string;
	htmlContent?: string;
	badgeText?: string; // e.g. "Sponsored", "Affiliate Partner", "Recommended"
	title?: string;
	description?: string;
	ctaText?: string;
}

export interface AdUnit {
	id: string;
	name: string;
	client: string; // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
	slot: string; // e.g. "1234567890"
	format?: AdFormat;
	layoutKey?: string; // for in-article ads
	responsive?: boolean;
	dimensions?: AdDimensions;
	fallback?: FallbackBanner;
	testMode?: boolean;
	/** IAB Content Taxonomy 3.0 category code (e.g. "IAB8-5" for Food & Drink) */
	contentCategory?: string;
	customStyle?: React.CSSProperties;
	className?: string;
}

export type PlacementType = "in_article" | "feed_grid";

export interface PlacementRule {
	id: string;
	projectId?: string;
	name: string;
	enabled: boolean;
	targetPattern?: string; // Regex or glob for URL pathname matching (e.g. "/recipes/*", "/recipes?page=*")
	deviceFilter: AdDeviceFilter;
	placementType?: PlacementType; // "in_article" (default) or "feed_grid"

	// In-Article Spacing Rules
	paragraphInterval: number; // e.g., after every 2nd or 3rd paragraph
	minWordsBeforeFirstAd: number; // e.g., don't inject before 150 words
	minParagraphsTotal: number; // don't inject if article is too short (e.g. < 4 paragraphs)
	maxAdsPerArticle: number; // max ad slots injected into the content body

	// Feed & Grid Spacing Rules
	itemInterval?: number; // Injects an ad card after every N items (e.g. 3)
	startOffset?: number; // First ad starts after item index (default: 1)
	maxAdsPerFeed?: number; // Total max ad cards in the feed (default: 3)
	gridSpan?: "card" | "full_width"; // 'card' spans 1 grid item, 'full_width' spans col-span-full

	// Safety & Exclusion Zones
	excludedSelectors?: string[]; // tags/classes to avoid (e.g. ["pre", "code", "blockquote", ".ingredients-box"])

	// Default ad unit mapped to this rule
	adUnitId: string;
}

export type FeedItem<T> =
	| { type: "item"; data: T; index?: number }
	| {
			type: "ad";
			adUnit: AdUnit;
			slotIndex: number;
			gridSpan: "card" | "full_width";
	  };

export interface AdInjectionOptions {
	rules: PlacementRule[];
	adUnits: Record<string, AdUnit>;
	isMobile?: boolean;
	pathname?: string;
}

export interface InjectedAdSlot {
	index: number;
	adUnit: AdUnit;
	ruleId: string;
	insertedAfterParagraph: number;
}

export interface AdInjectionResult<T = string> {
	content: T;
	insertedAds: InjectedAdSlot[];
	totalWords: number;
	totalParagraphs: number;
}

export type AdStatus =
	| "idle"
	| "loading"
	| "rendered"
	| "unfilled"
	| "blocked"
	| "error";

export interface AdAnalyticsEvent {
	type: "impression" | "viewable" | "fallback_rendered" | "blocked" | "error";
	adUnitId: string;
	slot: string;
	pathname: string;
	device: "mobile" | "desktop";
	timestamp: number;
	metadata?: Record<string, unknown>;
}

/**
 * Affiliate Monetization Types
 */

export interface AffiliateProduct {
	id: string;
	title: string;
	targetUrl: string;
	description?: string;
	price?: number | string;
	originalPrice?: number | string;
	currency?: string;
	rating?: number; // e.g. 4.8
	reviewsCount?: number;
	reviewCount?: number; // Alias for reviewsCount
	imageUrl?: string;
	imageAlt?: string;
	badgeText?: string; // e.g. "Best Overall", "Chef Pick", "Top Rated"
	ctaText?: string; // e.g. "Check Price on Amazon", "Shop Now"
	merchant?: string; // e.g. "Amazon", "Williams Sonoma", "Sur La Table"
	brand?: string;
	category?: string;
	sku?: string;
	customStyle?: React.CSSProperties;
	/** Optional frequency capping for user session */
	frequencyCap?: {
		scope: "session" | "day";
		max: number;
	};
}

export type AffiliateCardVariant =
	| "card"
	| "compact"
	| "horizontal"
	| "minimal";

export interface AffiliateKeywordRule {
	/** The exact keyword string or aliases to scan for (e.g. "air fryer" or ["air fryer", "airfryer"]) */
	keyword: string | string[];
	/** The affiliate or product target URL */
	targetUrl: string;
	/** Maximum number of times to replace this specific keyword per article (default: 1) */
	maxReplacements?: number;
	/** Whether keyword matching is case sensitive (default: false) */
	caseSensitive?: boolean;
	/** Optional HTML rel override */
	rel?: string;
	/** Optional HTML target override */
	target?: string;
	/** Optional custom tooltip or title attribute */
	title?: string;
	/** Optional custom CSS class name */
	className?: string;
	/** Product ID if linked to an AffiliateProduct */
	productId?: string;
}

export interface AffiliateKeywordOptions {
	/** List of keyword replacement rules */
	rules: AffiliateKeywordRule[];
	/** Maximum total affiliate links injected across the whole article (default: 4) */
	maxLinksTotal?: number;
	/** Maximum affiliate links allowed per 1,000 words (default: 3) */
	maxLinksPerThousandWords?: number;
	/** Minimum word distance between consecutive affiliate links */
	minWordsBetweenLinks?: number;
	/** HTML tags / elements to skip (default: ["a", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "button"]) */
	skipTags?: string[];
	/** Default rel attribute for links */
	rel?: string;
	/** Default target attribute for links */
	target?: string;
	/** Default CSS class for links */
	linkClassName?: string;
	/** Alias for linkClassName */
	className?: string;
	/** Optional idempotency key to prevent repeat scanning on re-render */
	idempotencyKey?: string;
	/** Callback triggered when a keyword is matched and replaced */
	onKeywordMatched?: (keyword: string, url: string) => void;
}

export interface AffiliateParamOptions {
	/** The base or target URL */
	url: string;
	/** Custom query parameters */
	params?: Record<string, string | number | boolean | undefined | null>;
	/** Amazon Associates tag (e.g. "ladyrecipes-20") -> sets `tag` param */
	amazonTag?: string;
	/** Sub-ID / custom campaign identifier (sets `subId` or network equivalent) */
	subId?: string;
	/** UTM Source (e.g. "adinject", "newsletter") */
	utmSource?: string;
	/** UTM Medium (e.g. "affiliate", "recipe_card") */
	utmMedium?: string;
	/** UTM Campaign */
	utmCampaign?: string;
	/** UTM Content */
	utmContent?: string;
}

export interface AffiliateABVariant {
	id: string;
	product: AffiliateProduct;
	weight?: number; // Weight for probability distribution (e.g. 50 vs 50)
}

export interface AffiliateABTest {
	id: string;
	variants: AffiliateABVariant[];
	seed?: string; // Optional deterministic seed for SSR consistency
}

export interface AffiliateClickEvent {
	productId: string;
	productTitle: string;
	targetUrl: string;
	merchant?: string;
	placement: string; // e.g. "in-feed", "in-article", "equipment-box", "keyword-link", "fallback"
	timestamp: number;
	pathname?: string;
	metadata?: Record<string, unknown>;
}

export type AffiliateDisclosureVariant =
	| "banner"
	| "compact"
	| "footer"
	| "inline";

/**
 * Consent Status for GDPR, IAB TCF, Google Consent Mode v2, and IAB GPP
 */
export type ConsentStatus = "unknown" | "granted" | "denied";

export type ConsentMode = "google-consent-v2" | "tcf" | "gpp" | "custom";

export interface ConsentContextValue {
	status: ConsentStatus;
	mode: ConsentMode;
	grant: () => void;
	deny: () => void;
	reset: () => void;
}

export interface ConsentProviderProps {
	mode?: ConsentMode;
	getConsent?: () => ConsentStatus | Promise<ConsentStatus>;
	listenEvent?: string;
	initialStatus?: ConsentStatus;
	children: React.ReactNode;
}

export type AdConsentFallback =
	| "affiliate"
	| "placeholder"
	| "hidden"
	| React.ReactNode;
