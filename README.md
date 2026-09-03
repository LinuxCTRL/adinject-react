# adinject-react

[![npm version](https://img.shields.io/npm/v/adinject-react?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/adinject-react)
[![npm downloads](https://img.shields.io/npm/dm/adinject-react?style=flat-square&color=blue&logo=npm)](https://www.npmjs.com/package/adinject-react)
[![npm total downloads](https://img.shields.io/npm/dt/adinject-react?style=flat-square&color=green&logo=npm)](https://www.npmjs.com/package/adinject-react)
[![GitHub](https://img.shields.io/badge/GitHub-LinuxCTRL%2Fadinject--react-181717?style=flat-square&logo=github)](https://github.com/LinuxCTRL/adinject-react)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue?style=flat-square)](https://www.typescriptlang.org/)
[![0 Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)](https://www.npmjs.com/package/adinject-react)
[![Next.js](https://img.shields.io/badge/Next.js-14--16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![CLS Safe](https://img.shields.io/badge/CLS-Safe%20by%20Design-purple?style=flat-square)](https://web.dev/cls/)
[![Consent v2 + GPP](https://img.shields.io/badge/Consent%20Mode-v2%20%2B%20GPP-orange?style=flat-square)](https://support.google.com/google-ads/answer/10000067)
[![MIT License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

> **A zero-dependency ad engine for Next.js App Router.**  
> Insert ads naturally into articles and feeds with zero layout shift, consent-aware delivery, and automatic fallback to affiliate content.

---

## ⚡ 30-Second Quick Start

```bash
npm install adinject-react
# or
bun add adinject-react
```

### 1. Set global defaults in your Root Layout (`app/layout.tsx`)

```tsx
import { AdInjectProvider, ConsentProvider, AdSenseScript } from "adinject-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <AdSenseScript client="ca-pub-1234567890123456" />
      </head>
      <body>
        <ConsentProvider mode="google-consent-v2">
          <AdInjectProvider client="ca-pub-1234567890123456">
            {children}
          </AdInjectProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
```

### 2. Drop ad slots anywhere (Zero-Boilerplate)

```tsx
import { AdSenseSlot } from "adinject-react";

export default function Sidebar() {
  // Inherits client ID from AdInjectProvider automatically
  return <AdSenseSlot slot="9876543210" format="rectangle" />;
}
```

### 3. In-Article Spacing or In-Feed Grids

```tsx
import { InArticleAds, AdInjectFeed } from "adinject-react";

// In-Article: automatically places ads every 3 paragraphs
<InArticleAds html={recipeHtml} interval={3} slot="9876543210" />

// In-Feed: interleaves ad cards into recipe or product grids
<AdInjectFeed
  items={recipes}
  interval={3}
  startOffset={1}
  renderItem={(recipe) => <RecipeCard recipe={recipe} />}
/>
```

---

## 🛠️ Companion Visual DevTools: `adinject-devtools`

For local development, inspect your live ad slots, audit policy compliance, simulate realistic creatives, and visually point-and-click to place ads on your page using **[`adinject-devtools`](https://www.npmjs.com/package/adinject-devtools)**:

```bash
npm install --save-dev adinject-devtools
# or
bun add -d adinject-devtools
```

```tsx
import { AdInjectProvider } from "adinject-react";
import { AdInjectDevTools } from "adinject-devtools";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdInjectProvider client="ca-pub-1234567890123456">
          {children}
          {/* Automatically tree-shaken in production builds */}
          <AdInjectDevTools />
        </AdInjectProvider>
      </body>
    </html>
  );
}
```

### ✨ Features of `adinject-devtools`:
- 🎯 **Point & Click Visual Inserter**: Click anywhere on your live webpage to place mock ads and generate copy-paste ready JSX.
- ✨ **Auto-Pick Best Places**: 1-click AI engine that selects optimal high-CTR, zero-CLS locations.
- 🤖 **AI Prompt Generator**: Generates clean Markdown prompts for **Cursor, Claude Code, Antigravity & Copilot**.
- 🛡️ **Zero-CLS Policy Auditor**: Audits Better Ads & Google Publisher compliance in real time.
- 🎨 **Creative Mockup Studio**: 6 industry themes (Tech, SaaS, Food, E-Commerce, Travel, Finance) with 1-click drop onto page.

---

## 🎥 See it in Production

- 🌐 **[Live Production Website (lady.recipes)](https://lady.recipes/)** — Experience real-time in-feed ad insertion with zero layout shift.
- 📺 **[Watch Walkthrough Video](https://drive.google.com/file/d/1CbygWorsfYaYb5MeRdT9knq0sNzO0k3Q/view?usp=sharing)** — Step-by-step video demo of feed placement and responsive behavior.

---

## 🤔 Why adinject-react?

| Problem with Raw Scripts | How `adinject-react` Solves It |
| :--- | :--- |
| **Cumulative Layout Shift (CLS)**: Ad scripts push reading content down when creatives load. | **CLS-Safe by Design**: Pre-allocates exact aspect-ratio bounding boxes before network scripts load. |
| **Blank Boxes on AdBlock / Unfill**: Empty whitespace breaks user reading experience. | **Affiliate Fallback Engine**: Replaces unfilled or blocked slots with high-converting cookbook/affiliate cards. |
| **GDPR / Privacy Liability**: Third-party ad scripts fire before user grants consent. | **Consent Gated**: Integrated with Google Consent Mode v2 & IAB GPP (`granted` vs `denied` state machine). |
| **Hydration & SPA Rerenders**: Ad tags fire twice on route transitions or React StrictMode. | **Idempotent Caching**: Uses `idempotencyKey` memoization so renders never duplicate ad slots or links. |

```
Google AdSense / GAM answers: "How do I serve an ad creative?"
adinject-react answers:        "Where, when, and how should ads be placed in React content safely?"
```

---

## 🏗️ Architecture & Placement Flow

```
                      Content Body / Feed Items
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
            In-Article Spacing              In-Feed Grids
         (Paragraph / Word Rules)        (Interval / Offset Rules)
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                        Consent State Machine
                      (Google Consent v2 / GPP)
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
             [Granted]                        [Denied]
                  │                               │
         Ad Network Adapter                       ▼
       ┌──────────┼──────────┐             Affiliate Fallback
    AdSense      GAM       Ezoic               Banner
       │          │          │                    │
       └──────────┼──────────┘                    │
                  ▼                               │
         Blocked / Unfilled? ─────────────────────┘
                  ▼
         Render Zero-CLS Slot
```

---

## 🚀 Core Capabilities

### 1. In-Article Paragraph Spacing (`<InArticleAds />`)

Automatically injects ad slots between content paragraphs without modifying your CMS source text:

```tsx
import { InArticleAds } from "adinject-react";

export default function ArticlePage({ post }: { post: Post }) {
  return (
    <article className="prose max-w-2xl mx-auto">
      <h1>{post.title}</h1>
      <InArticleAds
        html={post.contentHtml}
        interval={3}        // Ad every 3 paragraphs
        startOffset={1}     // First ad appears after paragraph 1
        maxAds={4}          // Cap at 4 ads per article
        slot="9876543210"
        fallback={{
          id: "book-fallback",
          name: "Recipe E-Book",
          type: "custom_cta",
          targetUrl: "https://shop.example.com/cookbook",
          title: "Download our 50 Best Mediterranean Recipes",
          badgeText: "Recommended",
          ctaText: "Get E-Book",
        }}
      />
    </article>
  );
}
```

---

### 2. In-Feed Grid Insertion (`<AdInjectFeed />`)

Interleaves ad cards cleanly into product catalogs, recipe grids, or infinite scroll feeds:

```tsx
import { AdInjectFeed } from "adinject-react";

export default function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  return (
    <AdInjectFeed
      items={recipes}
      interval={3}        // In-feed ad card every 3 recipes
      startOffset={1}     // Place first ad after 1st recipe card
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
    />
  );
}
```

---

### 3. Multi-Network Adapters (AdSense, GAM, Ezoic, Custom)

`adinject-react` is network-agnostic. Use Google AdSense, Google Ad Manager (GAM), Ezoic, or write your own adapter:

```tsx
import { AdInjectFeed, gamAdapter, ezoicAdapter } from "adinject-react";

// Google Ad Manager (GAM / GPT)
const gam = gamAdapter({
  networkCode: "12345678",
  testMode: process.env.NODE_ENV !== "production",
});

// Ezoic
const ezoic = ezoicAdapter({ siteId: "12345" });

// Use with Feed or Slot
<AdInjectFeed items={recipes} adapter={gam} renderItem={...} />
```

---

### 4. Automated Affiliate Autolinker (`injectAffiliateKeywords`)

Automatically transforms article keywords into compliant, high-converting affiliate links with FTC disclosures:

```tsx
import { injectHtmlAffiliateKeywords } from "adinject-react";

const monetizedHtml = injectHtmlAffiliateKeywords(articleHtml, {
  rules: [
    {
      keyword: "air fryer",
      targetUrl: "https://amazon.com/dp/B08...?tag=mytag-20",
      maxReplacements: 1, // Limit replacements per article
    },
    {
      keyword: ["dutch oven", "cast iron pot"],
      targetUrl: "https://amazon.com/dp/B07...?tag=mytag-20",
    },
  ],
  maxLinksTotal: 4,
  maxLinksPerThousandWords: 2, // Density guard against keyword stuffing
});
```

---

### 5. IAB Viewability Tracking (`useAdMetrics`)

Tracks real viewability metrics (at least 50% in viewport for $\ge 1$ second) with automated Invalid Traffic (IVT) bot filtering:

```tsx
import { useAdMetrics } from "adinject-react";

function CustomAdBanner() {
  const { ref, isViewable, viewableDurationMs } = useAdMetrics({
    threshold: 0.5,
    viewableTimeMs: 1000,
    filterInvalidTraffic: true, // Filters headless bots and crawlers
    onViewable: () => console.log("Ad viewability milestone achieved"),
  });

  return <div ref={ref}>{/* Ad Creative */}</div>;
}
```

---

### 6. Sanity CMS & Portable Text AST Injection

Operates directly on Sanity's Abstract Syntax Tree (AST) before React renders, eliminating regex parsing, DOM scraping, and hydration layout shifts:

```tsx
import { injectPortableTextAds, injectPortableTextAffiliate } from "adinject-react";

// Injects ad slots and affiliate recommendation cards directly into the Portable Text AST
const { content: transformedBlocks } = injectPortableTextAds({
  blocks: post.body,
  rule: {
    id: "article_rule",
    name: "Article Body Ads",
    enabled: true,
    paragraphInterval: 3,       // Injects after every 3 paragraphs
    minWordsBeforeFirstAd: 80,  // Minimum 80 words before first ad
    maxAdsPerArticle: 3,        // Maximum 3 ads
    adUnitId: "article_slot",
  },
  adUnit: {
    id: "article_slot",
    client: "ca-pub-1234567890",
    slot: "9876543210",
    format: "fluid",
    testMode: true,
  },
});
```

> **Official Sanity Reference Template & Starter**:  
> Check out the complete, production-ready example showcase at [https://github.com/LinuxCTRL/sanity-adinject](https://github.com/LinuxCTRL/sanity-adinject).

---

## 💻 Next.js & React Compatibility

| Environment | Support | Notes |
| :--- | :---: | :--- |
| **Next.js 16** | ✅ | Fully verified with React 19 compiler |
| **Next.js 15** | ✅ | App Router & Turbopack compatible |
| **Next.js 14** | ✅ | App Router & Pages Router |
| **React 19** | ✅ | Full support for latest React 19 hooks and JSX |
| **React 18** | ✅ | Backward compatible |
| **Zero Runtime Dependencies** | ✅ | **0** external `node_modules` dependencies |
| **TypeScript** | ✅ | Strict type definitions included natively |

---

## 🛡️ Privacy & Zero-Data Collection Guarantee

- **0 External Telemetry**: `adinject-react` sends zero analytics, metrics, or telemetry back to any third-party server.
- **100% First-Party Execution**: All layout calculations, keyword matching, and paragraph parsing run locally in your app.
- **Cookie-Free Fallbacks**: When user consent is denied, ad slots swap to pure static affiliate cards with zero tracking cookies.
- **IAB GPP & TCF v2**: Fully listens for global consent signals (`window.__gpp` and `window.__tcfapi`).

---

## 📖 Complete API Reference

### Client Components
| Component | Purpose |
| :--- | :--- |
| `<AdInjectProvider />` | Root provider distributing `client`, `testMode`, `defaultFallback`, and config defaults. |
| `<ConsentProvider />` | State machine for Google Consent Mode v2 & IAB GPP compliance. |
| `<AdSenseSlot />` | Zero-CLS responsive Google AdSense slot with automatic unfill detection. |
| `<InArticleAds />` | Declarative in-article ad spacing container for HTML and Markdown. |
| `<AdInjectFeed />` | In-feed ad card inserter for grid catalogs, list feeds, and infinite scroll. |
| `<InFeedAdCard />` | Standalone feed ad card with sponsored label and responsive aspect ratios. |
| `<AdFallback />` | Fallback banner component when ads are unfilled or blocked. |
| `<AffiliateCard />` | High-converting affiliate product card (`horizontal`, `card`, `compact`, `minimal`). |
| `<AffiliateEquipmentBox />` | Structured equipment list for recipe & review articles. |
| `<AffiliateDisclosure />` | FTC & Amazon Associates compliant disclosure banner. |
| `<AffiliateABSlot />` | Deterministic A/B testing container for affiliate products. |

### Transformers & Hooks
| Export | Purpose |
| :--- | :--- |
| `injectHtmlAds()` | Injects ad markers into HTML strings based on paragraph rules. |
| `injectMarkdownAds()` | Injects ad markers into Markdown strings without breaking code blocks. |
| `injectFeedAds()` | Injects ad items into JavaScript arrays with `idempotencyKey` caching. |
| `injectPortableTextAds()` | Injects ad blocks into Sanity Portable Text AST structures. |
| `injectHtmlAffiliateKeywords()` | Autolinks keywords in HTML with density caps. |
| `injectMarkdownAffiliateKeywords()` | Autolinks keywords in Markdown/MDX with link protection. |
| `useConsent()` | Accesses active consent status (`granted`, `denied`, `pending`). |
| `useAdMetrics()` | Measures IAB ad viewability and viewable duration with IVT bot filtering. |
| `gamAdapter()` | Built-in adapter for Google Ad Manager (GPT). |
| `ezoicAdapter()` | Built-in adapter for Ezoic ad placeholders. |

---

## 📄 License

MIT © 
