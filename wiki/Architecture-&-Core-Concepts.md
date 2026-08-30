# Architecture & Core Concepts

This document explains the mental model, headless architecture, zero-CLS layout algorithms, and execution pipeline of `adinject-react`.

---

## 1. The Headless Ad Engine Philosophy

Traditional ad SDKs combine creative delivery, network communication, DOM injection, and styling into a single opaque script. This causes major issues in modern React / Next.js applications:
* Cumulative Layout Shift (CLS) when network creatives pop in unexpectedly.
* Hydration errors and duplicate script tags on SPA route transitions.
* Consent violations when scripts run before user consent is obtained.
* Ugly blank whitespace when ads are blocked or unfilled.

`adinject-react` decouples these concerns:

```
┌────────────────────────────────────────────────────────┐
│ Google AdSense / GAM answers: "How do I serve an ad?"  │
├────────────────────────────────────────────────────────┤
│ adinject-react answers:                                │
│ "Where, when, and how should ads be placed in React   │
│  content safely, predictably, and with zero CLS?"      │
└────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Placement Flow

When your application renders content, `adinject-react` coordinates layout, consent, network adapters, and fallbacks:

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
          Ad Network Adapter                      ▼
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

## 3. Zero Cumulative Layout Shift (CLS Safe by Design)

Core Web Vitals scores heavily penalize layout shifts ($CLS > 0.1$). Ads are the single largest source of CLS on the web because ad creatives load asynchronously after the main DOM has painted.

`adinject-react` solves this at the CSS and layout container level with `<AdSlotFrame />`:

### Built-in Dimension Defaults
| Format | Default Min Height | Default Aspect Ratio | Standard Creative Sizes |
| :--- | :--- | :--- | :--- |
| `rectangle` | `250px` | `300/250` | 300x250 Medium Rectangle, 336x280 Large Rectangle |
| `horizontal` | `90px` | `728/90` | 728x90 Leaderboard, 970x90 Super Leaderboard, 320x50 Mobile Banner |
| `vertical` | `600px` | `160/600` | 160x600 Wide Skyscraper, 300x600 Half Page |
| `fluid` | `250px` | Flexible | In-Article Native, Responsive Feed Card |

### Dev-Mode CLS Regression Guard
During development (`process.env.NODE_ENV !== "production"`), `adinject-react` inspects the rendered ad creative height against the reserved box. If deviation exceeds `40px`, a helpful warning is logged:

```
[AdInject CLS Guard] Ad slot #9876543210 rendered at 350px but reserved 250px (deviation: 100px).
Adjust dimensions prop to prevent Cumulative Layout Shift (CLS).
```

---

## 4. React Server Components (RSC) vs Client Components

In Next.js App Router:
- **Server Components** (`async function Page()`) can fetch data and run pure transformers (`injectFeedAds`, `injectHtmlAds`, `injectMarkdownAds`, `injectPortableTextAds`).
- **Interactive UI components** (`<AdSenseSlot />`, `<AdInjectFeed />`, `<InArticleAds />`, `<ConsentProvider />`) contain `"use client"` directives and hook into React state, intersection observers, and window events.

### Pattern: Server Page with Declarative Client Ad Component

```tsx
// app/recipes/page.tsx (Server Component)
import { AdInjectFeed } from "adinject-react"; // "use client" inside
import { RecipeCard } from "@/components/recipe-card";

export default async function RecipesPage() {
  const recipes = await getRecipes(); // Run on server

  return (
    <AdInjectFeed
      items={recipes}
      interval={3}
      renderItem={(recipe) => <RecipeCard recipe={recipe} />}
    />
  );
}
```

---

## 5. Idempotency & StrictMode Caching

React 18 & 19 mount components twice in development (`StrictMode`), and Next.js SPA transitions frequently re-render views. 

`adinject-react` includes an internal memory cache and type guards:
1. **Feed Interleaving**: If an array already contains ad items (`item.type === "ad"`), `injectFeedAds` strips them before re-evaluating to prevent ad stacking.
2. **Stable Keys**: Passing `idempotencyKey="feed-page-1"` guarantees instant memoized lookups.
3. **Keyword Autolinker**: Applied affiliate links receive `data-adinject-affiliate="1"` so subsequent scans never wrap already-linked phrases.
