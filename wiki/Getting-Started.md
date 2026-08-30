# Getting Started with `adinject-react`

This guide walks you through installing and configuring `adinject-react` in your Next.js App Router application.

---

## 1. Installation

Install the package via your favorite package manager:

```bash
# npm
npm install adinject-react

# bun
bun add adinject-react

# pnpm
pnpm add adinject-react

# yarn
yarn add adinject-react
```

### Peer Dependencies
`adinject-react` requires React 18 or 19 and Next.js 14, 15, or 16:
* `react` >= 18.0.0 (Supports React 19.x)
* `react-dom` >= 18.0.0 (Supports React 19.x)
* `next` >= 14.0.0 (Optional peer dependency for non-Next.js environments)

---

## 2. Root Layout Setup (`app/layout.tsx`)

Wrap your application in `ConsentProvider` and `AdInjectProvider`, and place `AdSenseScript` in the `<head>` or layout:

```tsx
import type { Metadata } from "next";
import { AdInjectProvider, ConsentProvider, AdSenseScript } from "adinject-react";

export const metadata: Metadata = {
  title: "My Monetized Application",
  description: "Built with Next.js and adinject-react",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-1234567890123456";

  return (
    <html lang="en">
      <head>
        {/* Global non-blocking script loader with automatic SPA deduplication */}
        <AdSenseScript client={publisherId} />
      </head>
      <body>
        {/* State machine for GDPR, Google Consent Mode v2, and IAB GPP */}
        <ConsentProvider mode="google-consent-v2">
          {/* Context provider that cascades publisher client ID and fallback configs */}
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

## 3. Drop In Your First Ad Unit

### A. Declarative In-Feed Card Grid (`<AdInjectFeed />`)
Ideal for recipe catalogs, e-commerce listings, blog post lists, and infinite scroll feeds:

```tsx
import { AdInjectFeed } from "adinject-react";
import { RecipeCard } from "@/components/recipe-card";

export default async function RecipesPage() {
  const recipes = await fetchRecipes();

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Latest Recipes</h1>

      <AdInjectFeed
        items={recipes}
        interval={4}        // Insert an ad card after every 4 recipe cards
        startOffset={2}     // First ad appears after card #2
        maxAds={3}          // Maximum 3 ads in this feed
        gridSpan="card"     // "card" matches 1 grid column; "full_width" spans col-span-full
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
      />
    </main>
  );
}
```

### B. In-Article Spacing for Long-Form Content (`<InArticleAds />`)
Ideal for blog posts, news articles, and markdown documentation:

```tsx
import { InArticleAds } from "adinject-react";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  return (
    <article className="prose max-w-3xl mx-auto py-8">
      <h1>{post.title}</h1>

      <InArticleAds
        html={post.contentHtml}  // Or pass markdown={post.contentMarkdown}
        interval={3}             // 1 ad every 3 paragraphs
        startOffset={1}          // First ad after paragraph 1
        maxAds={4}               // Maximum 4 ads across the article
        slot="9876543210"        // Ad unit slot ID (inherits client from provider)
        fallback={{
          id: "recipe-ebook-fallback",
          name: "Recipe E-Book",
          type: "custom_cta",
          targetUrl: "https://example.com/cookbook",
          title: "Download our 50 Best Mediterranean Recipes",
          badgeText: "Recommended",
          ctaText: "Get E-Book",
        }}
      />
    </article>
  );
}
```

### C. Fixed Single Ad Slot (`<AdSenseSlot />`)
Ideal for sidebars, sticky footers, or headers:

```tsx
import { AdSenseSlot } from "adinject-react";

export function Sidebar() {
  return (
    <aside className="w-80 space-y-6">
      <h3 className="font-semibold text-sm">Sponsored Content</h3>
      <AdSenseSlot
        slot="9876543210"
        format="rectangle"       // "rectangle" | "horizontal" | "vertical" | "fluid"
        contentCategory="IAB8-5" // Optional IAB Content Taxonomy 3.0 code
      />
    </aside>
  );
}
```

---

## 4. Next Steps

- Learn about the [Architecture & Core Concepts](Architecture-&-Core-Concepts).
- Explore the complete [Components Reference](Components-Reference).
- Connect alternative ad networks in [Multi-Network Adapters](Multi-Network-Adapters).
- Set up automated affiliate links in [Affiliate Monetization & Autolinker](Affiliate-Monetization-&-Autolinker).
