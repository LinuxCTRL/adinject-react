---
name: adinject
description: >-
  Comprehensive guide and operational runbook for integrating, configuring,
  and troubleshooting the AdInject headless ad monetization engine (adinject-react)
  in Next.js App Router (Next.js 14-16 & React 19).
---

# AdInject Headless Ad Engine Skill for Next.js App Router

This skill provides complete operational runbooks, architectural patterns, component usage, and troubleshooting recipes for integrating **AdInject** (`adinject-react`) into Next.js App Router projects.

---

## 1. Installation

```bash
npm install adinject-react
# or
bun add adinject-react
# or
pnpm add adinject-react
```

### Peer Dependencies
* `react` >= 18.0.0 (Supports React 19.x)
* `react-dom` >= 18.0.0
* `next` >= 14.0.0 (Supports Next.js 15 & 16)

---

## 2. Global Script & Layout Setup (`src/app/layout.tsx`)

Place `<AdSenseScript />` inside `src/app/layout.tsx` for non-blocking AdSense initialization:

```tsx
import { AdSenseScript } from "adinject-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdSenseScript client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-XXXXXXXXXXXXXXXX"} />
        {children}
      </body>
    </html>
  );
}
```

---

## 3. Feed & Card Grid Ad Placement (e.g. Recipe / Product / Blog Feeds)

### Recipe A: Drop-In Declarative Feed Container (`<AdInjectFeed />`)
Use for standard list and grid layouts:

```tsx
import { AdInjectFeed } from "adinject-react";
import { RecipeCard } from "@/components/recipe-card";

export default async function BrowseRecipesPage() {
  const recipes = await getRecipes();

  return (
    <AdInjectFeed
      items={recipes}
      interval={4}              // Injects an ad after every 4 recipe cards
      startOffset={2}           // First ad appears after card #2
      maxAds={3}                // Maximum 3 ads per page
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
    />
  );
}
```

### Recipe B: Array Interleaving with Type Guard (`injectFeedAds` + `isAdSlot`)
Use when you need granular control over the wrapper DOM or animations:

```tsx
"use client";

import { injectFeedAds, isAdSlot, InFeedAdCard } from "adinject-react";
import { RecipeCard } from "@/components/recipe-card";

export function RecipeGrid({ recipes }) {
  const feedItems = injectFeedAds({
    items: recipes,
    rule: {
      itemInterval: 4,
      startOffset: 2,
      maxAdsPerFeed: 3,
      gridSpan: "card",
      enabled: true,
    },
    adUnit: {
      client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT!,
      slot: process.env.NEXT_PUBLIC_ADSENSE_SLOT!,
      format: "rectangle",
      responsive: true,
      fallback: {
        id: "affiliate-partner-1",
        name: "Recommended Cookbook",
        type: "custom_cta",
        targetUrl: "https://example.com/affiliate",
        title: "Chef Masterclass & Recipes",
        description: "100+ foolproof recipes and culinary techniques.",
        badgeText: "Recommended",
        ctaText: "Explore Now",
      },
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {feedItems.map((item, index) => {
        if (isAdSlot(item)) {
          return (
            <div key={`feed-ad-${item.slotIndex}`} className="h-full">
              <InFeedAdCard adUnit={item.adUnit} slotIndex={item.slotIndex} />
            </div>
          );
        }
        return <RecipeCard key={item.data.id} recipe={item.data} />;
      })}
    </div>
  );
}
```

---

## 4. In-Article Content Spacing (Markdown / Sanity Portable Text / HTML)

### Markdown / Custom AST Inserter
When looping over parsed Markdown blocks, track paragraphs and insert an ad slot component:

```tsx
import { AdSenseSlot } from "adinject-react";

// Inside Markdown block renderer:
if (paragraphCount % 3 === 0 && adsInserted < 3) {
  elements.push(
    <div key={`ad-${adsInserted}`} className="my-8">
      <AdSenseSlot
        client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT!}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT!}
        format="rectangle"
        responsive={true}
      />
    </div>
  );
  adsInserted++;
}
```

### Sanity Portable Text Adapter
```tsx
import { injectPortableTextAds, AdSenseSlot } from "adinject-react";
import { PortableText } from "@portabletext/react";

export default async function BlogPost({ post }) {
  const transformed = injectPortableTextAds({
    blocks: post.body,
    rule: {
      paragraphInterval: 2,
      minWordsBeforeFirstAd: 35,
      maxAdsPerArticle: 3,
      enabled: true,
    },
    adUnit: {
      client: "ca-pub-XXXXXXXXXXXXXXXX",
      slot: "1234567890",
      format: "rectangle",
    },
  });

  const ptComponents = {
    types: {
      "adinject.adSlot": ({ value }) => (
        <AdSenseSlot client={value.adUnit.client} slot={value.adUnit.slot} />
      ),
    },
  };

  return <PortableText value={transformed.content} components={ptComponents} />;
}
```

---

## 5. Live Edge Config API Integration (No Redeploys Needed)

Connect to the AdInject Platform Edge API so placement rules, frequencies, and affiliate fallbacks update dynamically in real time:

```tsx
import { fetchAdInjectConfig, AdInjectProvider } from "adinject-react";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await fetchAdInjectConfig({
    projectId: process.env.NEXT_PUBLIC_ADINJECT_PROJECT_ID || "proj_lady_recipes",
    baseUrl: process.env.NEXT_PUBLIC_ADINJECT_API_URL || "https://adinject.io",
    revalidate: 300, // Cache for 5 minutes at Edge
  });

  return (
    <html lang="en">
      <body>
        <AdInjectProvider config={config}>
          {children}
        </AdInjectProvider>
      </body>
    </html>
  );
}
```

---

## 6. Critical Troubleshooting & Best Practices

### ⚠️ React Server Component vs Client Component Boundaries
* **Issue:** `TypeError: useRef only works in Client Components`
* **Root Cause:** Next.js Server Components (`async function Page()`) cannot directly execute client hooks inside child JSX without a boundary.
* **Solution:** Create a client wrapper file with `"use client"` (e.g. `src/components/blog-ad.tsx` or `src/components/in-feed-slot.tsx`) when invoking interactive ad components directly from Server Components.

### ⚠️ Zero Cumulative Layout Shift (CLS)
* Never render unconstrained `<div>` containers for ad slots.
* `<AdSenseSlot />` pre-allocates aspect-ratio min-height boxes (`minHeight: 250px` for rectangles, `90px` for horizontal leaderboards) ensuring a **0.000 CLS** Core Web Vitals score.

### ⚠️ AdSense Script Deduplication
* Never place raw `<script>` tags in individual components.
* Use `<AdSenseScript />` once in `layout.tsx` — it automatically deduplicates script tags across client-side SPA navigations.
