# adinject-react

> **Next-Generation Headless Ad Engine & In-Article / In-Feed Inserter for Next.js App Router (Next.js 14-16 & React 19).**

Eliminate Cumulative Layout Shift (CLS), automate in-article paragraph spacing and feed card ad insertion, prevent blank white spaces on adblock or unfill, and safely navigate SPA route transitions without ad collisions.

---

## 🎥 Demo & Live Showcase

See `adinject-react` in action on **[lady.recipes](https://lady.recipes/)** (`recipes-ui`):

- 📺 **[Watch Demo Video](https://drive.google.com/file/d/1CbygWorsfYaYb5MeRdT9knq0sNzO0k3Q/view?usp=sharing)** — Video walkthrough demonstrating seamless in-feed ad insertion and zero-CLS performance.
- 🌐 **[Live Production Website (lady.recipes)](https://lady.recipes/)** — Check out how ad cards interleave seamlessly within recipe grids.

---

## ⚡ Quick Installation

```bash
npm install adinject-react
# or
bun add adinject-react
# or
pnpm add adinject-react
```

---

## 🚀 1. Feed & Card Grid Ad Insertion (e.g. Recipe / Product Catalogs)

### Method A: Declarative Drop-In Container (`<AdInjectFeed />`)

```tsx
import { AdInjectFeed } from "adinject-react";
import { RecipeCard } from "@/components/recipe-card";

export default async function BrowseRecipesPage() {
  const recipes = await getRecipes();

  return (
    <AdInjectFeed
      items={recipes}
      interval={3}              // Injects ad after every 3 cards
      startOffset={1}           // First ad appears after card #1
      maxAds={4}                // Cap at 4 ads per page
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
    />
  );
}
```

### Method B: Array Interleaving with Type Guard (`injectFeedAds` + `isAdSlot`)

```tsx
import { injectFeedAds, isAdSlot, InFeedAdCard } from "adinject-react";

export default async function RecipeGrid({ recipes }) {
  const feedWithAds = injectFeedAds({
    items: recipes,
    rule: {
      itemInterval: 3,
      startOffset: 1,
      maxAdsPerFeed: 4,
      gridSpan: "card",
      enabled: true
    },
    adUnit: {
      client: "ca-pub-1234567890123456",
      slot: "9876543210",
      format: "rectangle",
      responsive: true
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {feedWithAds.map((item, idx) => {
        if (isAdSlot(item)) {
          return (
            <InFeedAdCard
              key={`ad-${item.slotIndex}`}
              adUnit={item.adUnit}
              gridSpan={item.gridSpan}
            />
          );
        }

        return <RecipeCard key={item.data.id} recipe={item.data} />;
      })}
    </div>
  );
}
```

---

## 📖 2. In-Article Spacing (Sanity Portable Text & HTML)

### Sanity Portable Text

```tsx
import { injectPortableTextAds, AdSenseSlot } from "adinject-react";
import { PortableText } from "@portabletext/react";

export default async function RecipePost({ post }) {
  // Injects zero-CLS ad blocks after every 2 paragraphs
  const transformedBody = injectPortableTextAds({
    blocks: post.body,
    rule: {
      paragraphInterval: 2,
      minWordsBeforeFirstAd: 35,
      maxAdsPerArticle: 3,
      enabled: true
    },
    adUnit: {
      client: "ca-pub-1234567890123456",
      slot: "9876543210",
      format: "rectangle"
    }
  });

  const ptComponents = {
    types: {
      "adinject.adSlot": ({ value }) => (
        <AdSenseSlot
          client={value.adUnit.client}
          slot={value.adUnit.slot}
          format={value.adUnit.format}
        />
      )
    }
  };

  return (
    <article className="prose max-w-2xl mx-auto">
      <h1>{post.title}</h1>
      <PortableText value={transformedBody.content} components={ptComponents} />
    </article>
  );
}
```

---

## 🛡️ Core Features

* 🚀 **Zero Cumulative Layout Shift (CLS):** Pre-allocates IAB aspect-ratio containers to guarantee a 0.000 Google Core Web Vitals CLS score.
* 🔄 **SPA Navigation Resilient:** Handles client-side route transitions without script conflicts or unmounting glitches.
* 📦 **Lazy Loading Guard:** Built-in `IntersectionObserver` with customizable margins so ads only fetch when entering viewport.
* 🛡️ **Affiliate / AdBlock Fallback:** Replaces unfilled or ad-blocked white space with revenue-generating affiliate products.
* 🍱 **Feed & Grid Native:** Interleaves ads into array grids, recipe listings, and e-commerce catalogs.

---

## 📄 License
MIT © AdInject
