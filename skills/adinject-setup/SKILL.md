---
name: adinject-setup
description: Guides AI coding agents (Antigravity, Cursor, Claude Code, Copilot) to inspect a web project, install adinject-react, configure root layout providers (<AdInjectProvider />, <ConsentProvider />, <AdSenseScript />), set up in-article (<InArticleAds />) and in-feed (<AdInjectFeed />) zero-CLS ad units, and configure affiliate fallback banners.
---

# AdInject Setup Guide for AI Coding Agents

Use this skill whenever a user asks to monetize their React, Next.js (App Router / Pages Router), Sanity, or Headless CMS web application using `adinject-react`.

---

## 🎯 Agent Execution Workflow

Follow this 5-step automated workflow when setting up ad monetization:

```
[1. Inspect Framework & CMS] ➔ [2. Install adinject-react] ➔ [3. Configure Root Layout] ➔ [4. Inject Ad Slots] ➔ [5. Verify Zero CLS & Builds]
```

---

## Step 1: Inspect Framework & Codebase

1. Inspect `package.json` to identify:
   - Framework: Next.js (App Router vs Pages Router), Astro, Remix, or Vite/CRA.
   - React version: React 18 or React 19.
   - Content format: Raw HTML, Markdown/MDX, or Sanity Portable Text.
2. Ask or check for the user's **Publisher ID** (e.g. `ca-pub-1234567890123456`) and **Slot ID(s)**. If not provided, use placeholder IDs and alert the user.

---

## Step 2: Install Package

Run the package manager used by the project:

```bash
# npm
npm install adinject-react

# bun
bun add adinject-react

# pnpm
pnpm add adinject-react
```

---

## Step 3: Root Layout Configuration

Wrap the root layout with `<ConsentProvider />`, `<AdInjectProvider />`, and `<AdSenseScript />`.

### Next.js App Router (`app/layout.tsx`)

```tsx
import { AdInjectProvider, ConsentProvider, AdSenseScript } from "adinject-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-1234567890123456";

  return (
    <html lang="en">
      <head>
        {/* Global non-blocking script loader */}
        <AdSenseScript client={publisherId} />
      </head>
      <body>
        {/* Google Consent Mode v2 & IAB GPP State Machine */}
        <ConsentProvider mode="google-consent-v2">
          {/* Inherits publisher ID and fallback defaults down the tree */}
          <AdInjectProvider client={publisherId}>
            {children}
          </AdInjectProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
```

---

## Step 4: Drop In Zero-CLS Ad Units

### A. In-Article Spacing (Editorial / Blog / Recipes)
Use `<InArticleAds />` to automatically insert ads every $N$ paragraphs into HTML or Markdown without modifying CMS content:

```tsx
import { InArticleAds } from "adinject-react";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  return (
    <article className="prose max-w-3xl mx-auto py-8">
      <h1>{post.title}</h1>

      <InArticleAds
        html={post.contentHtml}  // Or markdown={post.contentMarkdown}
        interval={3}             // 1 ad every 3 paragraphs
        startOffset={1}          // First ad after paragraph 1
        maxAds={4}               // Max 4 ads per article
        slot="9876543210"        // Ad unit slot ID (inherits client from provider)
        fallback={{
          id: "affiliate-guide-book",
          name: "Recommended Guidebook",
          type: "custom_cta",
          targetUrl: "https://shop.example.com/guide",
          title: "Get The Complete Handbook",
          badgeText: "Recommended",
          ctaText: "Explore Now",
        }}
      />
    </article>
  );
}
```

### B. In-Feed & Card Grid Spacing (Catalogs / Recipe Grids)
Use `<AdInjectFeed />` to interleave responsive ad cards into item grids with `idempotencyKey` memoization:

```tsx
import { AdInjectFeed } from "adinject-react";
import { RecipeCard } from "@/components/recipe-card";

export default async function CatalogPage() {
  const recipes = await getRecipes();

  return (
    <AdInjectFeed
      items={recipes}
      interval={4}        // 1 ad card every 4 recipe items
      startOffset={2}     // First ad card after item #2
      maxAds={3}          // Maximum 3 ads in the grid
      gridSpan="card"     // "card" for 1 grid column, "full_width" for full width
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
    />
  );
}
```

### C. Sidebar / Fixed Ad Units
Use `<AdSenseSlot />` for single fixed positions (Sidebar, Sticky Footer, Above Title):

```tsx
import { AdSenseSlot } from "adinject-react";

export function SidebarAd() {
  return (
    <AdSenseSlot
      slot="9876543210"
      format="rectangle"          // "rectangle" | "horizontal" | "fluid" | "auto"
      contentCategory="IAB8-5"     // IAB 3.0 Category
    />
  );
}
```

---

## Step 5: Verify Build & Core Web Vitals

1. Run the project typecheck and production build (`npm run build` or `bun run build`).
2. Verify that:
   - There are no React hydration mismatches.
   - All ad slot dimensions are reserved with pre-allocated bounding boxes (0.000 CLS).
   - Denied consent cleanly displays the static affiliate fallback without loading third-party tracking scripts.
