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
  itemInterval?: number; // e.g. inject an ad every 4 or 6 cards/items
  startOffset?: number; // e.g. start after item #2 (0-indexed or 1-indexed offset)
  maxAdsPerFeed?: number; // max ad units in a single feed page (default: 4)
  gridSpan?: "card" | "full_width"; // "card" for 1 grid column or "full_width" for col-span-full

  // Safety & Exclusion Zones
  excludedSelectors?: string[]; // tags/classes to avoid (e.g. ["pre", "code", "blockquote", ".ingredients-box"])

  // Default ad unit mapped to this rule
  adUnitId: string;
}

export type FeedItem<T> =
  | { type: "item"; data: T; index: number }
  | {
      type: "ad";
      adUnit: AdUnit;
      slotIndex: number;
      ruleId?: string;
      gridSpan?: "card" | "full_width";
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
  imageUrl?: string;
  imageAlt?: string;
  price?: string | number;
  originalPrice?: string | number;
  currency?: string;
  rating?: number; // e.g. 4.8
  reviewCount?: number; // e.g. 1540
  merchant?: string; // e.g. "Amazon", "Target", "Williams-Sonoma", "Partner"
  badgeText?: string; // e.g. "Top Pick", "Best Value", "Editor's Choice", "25% OFF"
  ctaText?: string; // e.g. "Check Price", "Shop on Amazon", "View Deal"
  category?: string;
  tags?: string[];
  customStyle?: React.CSSProperties;
  className?: string;
}

export type AffiliateCardVariant =
  | "card"
  | "horizontal"
  | "compact"
  | "minimal";

export interface AffiliateKeywordRule {
  /** Keyword or phrase to match (e.g. "Air Fryer", "Dutch Oven") */
  keyword: string | string[];
  /** Target affiliate link URL */
  targetUrl: string;
  /** Maximum number of times to replace this specific keyword in a single document (default: 1) */
  maxReplacements?: number;
  /** Exact case matching (default: false) */
  caseSensitive?: boolean;
  /** Optional title attribute for the link */
  title?: string;
  /** HTML rel attribute (default: "noopener noreferrer sponsored") */
  rel?: string;
  /** Link target (default: "_blank") */
  target?: string;
  /** Custom CSS class for injected affiliate links */
  className?: string;
  /** Extra metadata / tracking tags */
  merchant?: string;
}

export interface AffiliateKeywordOptions {
  /** Rules mapping keywords to affiliate URLs */
  rules: AffiliateKeywordRule[];
  /** Global maximum affiliate links to insert into the entire document (default: 3) */
  maxLinksTotal?: number;
  /** HTML tags / elements to skip (default: ["a", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "button"]) */
  skipTags?: string[];
  /** Default rel attribute for links */
  rel?: string;
  /** Default target attribute for links */
  target?: string;
  /** Default CSS class for links */
  linkClassName?: string;
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

