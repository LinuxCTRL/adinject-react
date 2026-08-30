# Components Reference

`adinject-react` exports 12 production-ready React components built with full TypeScript strictness.

---

## Component Overview

| Component | Category | Description |
| :--- | :--- | :--- |
| [`<AdInjectProvider />`](#adinjectprovider-) | Providers | Top-level context provider distributing publisher defaults. |
| [`<ConsentProvider />`](#consentprovider-) | Providers | State machine for GDPR, Google Consent Mode v2, and IAB GPP. |
| [`<AdSenseScript />`](#adsensescript-) | Scripts | Global, non-blocking, deduplicated script loader. |
| [`<AdSenseSlot />`](#adsenseslot-) | Ad Units | Zero-CLS responsive Google AdSense slot with unfill detection. |
| [`<InArticleAds />`](#inarticleads-) | Ad Units | Declarative in-article spacing container for HTML & Markdown. |
| [`<AdInjectFeed />`](#adinjectfeed-) | Ad Units | Interleaved list/grid container for catalogs and recipe feeds. |
| [`<InFeedAdCard />`](#infeedadcard-) | Ad Units | Standalone feed card container with sponsored badge. |
| [`<AdSlotFrame />`](#adslotframe-) | Primitives | IAB accessible wrapper with zero-CLS bounding box. |
| [`<AdFallback />`](#adfallback-) | Fallbacks | Banner/CTA component rendered on adblock or unfill. |
| [`<AffiliateCard />`](#affiliatecard-) | Affiliate | 4-variant product card (`card`, `compact`, `horizontal`, `minimal`). |
| [`<AffiliateEquipmentBox />`](#affiliateequipmentbox-) | Affiliate | Structured equipment list for recipe & gear articles. |
| [`<AffiliateDisclosure />`](#affiliatedisclosure-) | Affiliate | FTC & Amazon Associates compliant disclaimer banner. |
| [`<AffiliateABSlot />`](#affiliateabslot-) | Affiliate | Deterministic A/B testing product container. |

---

## `<AdInjectProvider />`

The root context provider for all ad units in your application.

### Props
```ts
interface AdInjectProviderProps {
  client?: string;               // Default Google AdSense publisher ID (e.g. "ca-pub-1234567890123456")
  testMode?: boolean;            // Global test mode (renders clean placeholder box without network calls)
  defaultFallback?: FallbackBanner; // Global fallback banner when ads are unfilled
  contentCategory?: string;      // IAB Content Taxonomy 3.0 category (e.g. "IAB8-5" for Food & Drink)
  config?: AdInjectProjectConfig | null; // Remote config from fetchAdInjectConfig()
  projectId?: string;            // AdInject cloud project identifier
  children: React.ReactNode;
}
```

### Example
```tsx
import { AdInjectProvider } from "adinject-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdInjectProvider
      client="ca-pub-1234567890123456"
      testMode={process.env.NODE_ENV !== "production"}
      contentCategory="IAB8-5"
    >
      {children}
    </AdInjectProvider>
  );
}
```

---

## `<ConsentProvider />`

Manages privacy signals and gates ad rendering on user consent.

### Props
```ts
interface ConsentProviderProps {
  mode?: "google-consent-v2" | "tcf" | "gpp" | "custom"; // Default: "google-consent-v2"
  getConsent?: () => ConsentStatus | Promise<ConsentStatus>;
  listenEvent?: string;          // Window CustomEvent name fired by CMP on update
  initialStatus?: "unknown" | "granted" | "denied"; // Default: "unknown"
  children: React.ReactNode;
}
```

### Example
```tsx
import { ConsentProvider } from "adinject-react";

<ConsentProvider
  mode="google-consent-v2"
  getConsent={() => window.__cmp?.hasConsent() ? "granted" : "denied"}
  listenEvent="consent_updated"
>
  <App />
</ConsentProvider>
```

---

## `<AdSenseScript />`

Injects the Google AdSense client script in a non-blocking way, deduplicating across SPA navigations.

### Props
```ts
interface AdSenseScriptProps {
  client: string;                // e.g. "ca-pub-1234567890123456"
  crossOrigin?: "anonymous" | "use-credentials"; // Default: "anonymous"
  nonce?: string;                // CSP nonce
}
```

### Example
```tsx
import { AdSenseScript } from "adinject-react";

<head>
  <AdSenseScript client="ca-pub-1234567890123456" />
</head>
```

---

## `<AdSenseSlot />`

Zero-CLS AdSense slot with automatic lazy loading via IntersectionObserver, fallback rendering on unfill, and dev-mode CLS warnings.

### Props
```ts
interface AdSenseSlotProps {
  slot: string;                  // Ad slot ID (e.g. "9876543210")
  client?: string;               // Inherits from AdInjectProvider if omitted
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid" | "custom"; // Default: "auto"
  responsive?: boolean;          // Default: true
  layoutKey?: string;            // For in-article custom layout templates
  dimensions?: AdDimensions;     // Custom { minHeight, aspectRatio, width, height }
  fallback?: FallbackBanner;     // Fallback banner on unfill or adblock
  testMode?: boolean;            // Test mode toggle
  lazyLoad?: boolean;            // Lazy load when within 300px of viewport (default: true)
  consentFallback?: "affiliate" | "placeholder" | "hidden" | React.ReactNode; // Default: "affiliate"
  a11yLabel?: string;            // Accessibility label (default: "Advertisement")
  contentCategory?: string;      // IAB Content Taxonomy category
  className?: string;
  style?: React.CSSProperties;
  onStatusChange?: (status: AdStatus) => void;
}
```

---

## `<InArticleAds />`

Declaratively injects ad slots between content paragraphs in raw HTML or Markdown strings.

### Props
```ts
interface InArticleAdsProps {
  html?: string;                 // Raw HTML content string
  markdown?: string;             // Raw Markdown content string
  interval?: number;             // Paragraph interval between ads (default: 3)
  startOffset?: number;          // First ad appears after N paragraphs (default: 1)
  maxAds?: number;               // Max ads inserted into this article (default: 4)
  slot?: string;                 // AdSense slot ID
  format?: AdFormat;             // Default: "fluid"
  fallback?: FallbackBanner;
  contentCategory?: string;
  className?: string;
}
```

---

## `<AdInjectFeed />`

Interleaves ad cards cleanly into product catalogs, recipe grids, or infinite scroll feeds.

### Props
```ts
interface AdInjectFeedProps<T> {
  items: T[];                    // List of data items
  adapter?: AdAdapter;           // Optional network adapter (AdSense, GAM, Ezoic)
  interval?: number;             // Ad inserted after every N items (default: 3)
  startOffset?: number;          // First ad inserted after item index (default: 1)
  maxAds?: number;               // Total max ad cards in the feed (default: 4)
  gridSpan?: "card" | "full_width"; // Default: "card"
  className?: string;            // Grid CSS classes (e.g. "grid grid-cols-1 md:grid-cols-3 gap-6")
  renderItem: (item: T, index: number) => React.ReactNode;
  renderAd?: (adUnit: AdUnit, slotIndex: number, gridSpan?: "card" | "full_width") => React.ReactNode;
}
```

---

## `<AffiliateCard />`

High-converting, responsive affiliate product card supporting 4 visual variants.

### Props
```ts
interface AffiliateCardProps {
  product: AffiliateProduct;
  variant?: "card" | "compact" | "horizontal" | "minimal"; // Default: "card"
  placement?: string;            // Analytics tracking tag (default: "affiliate-card")
  showRating?: boolean;          // Default: true
  showPrice?: boolean;           // Default: true
  showMerchant?: boolean;        // Default: true
  a11yLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  onAffiliateClick?: (event: AffiliateClickEvent) => void;
}
```

### Variants
1. `card`: Standard catalog card with full image, rating, title, price, and CTA.
2. `horizontal`: Wide feature box ideal for in-article gear reviews.
3. `compact`: Compact horizontal row ideal for sidebar widgets and recipe ingredient links.
4. `minimal`: Subtle pill/badge link for inline mentions.

---

## `<AffiliateEquipmentBox />`

Structured equipment container for recipe articles, gear reviews, and shopping lists.

### Props
```ts
interface AffiliateEquipmentBoxProps {
  title?: string;                // Default: "Tools & Equipment Used"
  subtitle?: string;             // Default: "Tested and recommended for best results in this recipe."
  products: AffiliateProduct[];  // Array of affiliate products
  columns?: 1 | 2 | 3 | 4;       // Default: 2
  variant?: "compact" | "card" | "horizontal"; // Default: "compact"
  disclosureText?: string;       // Footer affiliate disclosure
  onAffiliateClick?: (event: AffiliateClickEvent) => void;
}
```

---

## `<AffiliateDisclosure />`

FTC & Amazon Associates compliant disclosure banner.

### Props
```ts
interface AffiliateDisclosureProps {
  variant?: "banner" | "compact" | "footer" | "inline"; // Default: "banner"
  preset?: "standard" | "amazon" | "custom";            // Default: "standard"
  customText?: string;
  policyUrl?: string;            // Link to full editorial affiliate policy
  collapsible?: boolean;         // Default: false
}
```

---

## `<AffiliateABSlot />`

Renders an A/B test variant of affiliate products based on variant weights or deterministic seed.

### Props
```ts
interface AffiliateABSlotProps {
  test: AffiliateABTest;
  variant?: AffiliateCardVariant;
  onAffiliateClick?: (event: AffiliateClickEvent) => void;
}
```
