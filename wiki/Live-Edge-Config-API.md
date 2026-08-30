# Live Edge Config API

When managing ad placements across hundreds of articles and routes, hardcoding placement frequencies or slot IDs requires redeploying your app every time you want to tune monetization.

`adinject-react` connects with the **AdInject Platform Edge API**, enabling you to fetch compiled placement rules, intervals, and fallback banners dynamically at runtime with full Incremental Static Regeneration (ISR) and stale-while-revalidate (SWR) caching.

---

## 1. Remote Config Client (`fetchAdInjectConfig`)

`fetchAdInjectConfig()` fetches project rules with built-in resilience:
- **Exponential Backoff**: Up to 3 attempts with progressive delay for transient network glitches.
- **SWR Memory Cache**: Fast in-memory caching for client and non-Next.js runtimes.
- **Next.js ISR Tags**: Uses `next: { revalidate: 300, tags: ['adinject-config-...'] }` for automatic edge caching.
- **Graceful Fallback**: Returns a static local fallback configuration if the network is completely unreachable.

---

## 2. Server Layout Integration (`app/layout.tsx`)

```tsx
import { fetchAdInjectConfig, AdInjectProvider } from "adinject-react";

// Optional local static fallback config in case remote API is offline
const LOCAL_FALLBACK_CONFIG = {
  projectId: "proj_lady_recipes",
  name: "Lady Recipes Staging",
  domain: "lady.recipes",
  status: "active" as const,
  rules: [
    {
      id: "rule_recipes_feed",
      name: "Recipes Feed Inserter",
      enabled: true,
      deviceFilter: "all" as const,
      placementType: "feed_grid" as const,
      paragraphInterval: 3,
      minWordsBeforeFirstAd: 30,
      minParagraphsTotal: 2,
      maxAdsPerArticle: 3,
      itemInterval: 3,
      startOffset: 1,
      maxAdsPerFeed: 3,
      adUnitId: "unit_feed_card",
    },
  ],
  adUnits: {
    unit_feed_card: {
      id: "unit_feed_card",
      name: "Feed In-Feed Slot",
      client: "ca-pub-1234567890123456",
      slot: "9876543210",
      format: "fluid" as const,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await fetchAdInjectConfig({
    projectId: process.env.NEXT_PUBLIC_ADINJECT_PROJECT_ID || "proj_lady_recipes",
    baseUrl: process.env.NEXT_PUBLIC_ADINJECT_API_URL || "https://adinject.io",
    revalidate: 300, // Revalidate cache every 5 minutes at the Edge
    fallbackConfig: LOCAL_FALLBACK_CONFIG,
  });

  return (
    <html lang="en">
      <body>
        <AdInjectProvider config={config} projectId="proj_lady_recipes">
          {children}
        </AdInjectProvider>
      </body>
    </html>
  );
}
```

---

## 3. Dynamic Rule Evaluation (`findMatchingRule`)

`adinject-react` includes client and server route evaluators to match path globs and device types:

```ts
import { findMatchingRule } from "adinject-react";

const matchingRule = findMatchingRule(config.rules, {
  pathname: "/recipes/dinner/pasta",
  isMobile: true,
});

if (matchingRule) {
  console.log(`Matched rule: ${matchingRule.name}`);
  console.log(`Interval: ${matchingRule.paragraphInterval}`);
}
```

### Supported Match Patterns
* `"/recipes/*"` — matches any path starting with `/recipes/`
* `"/blog?page=*"` — matches query string patterns
* `"*"` — matches all paths
* Device filters: `"all"`, `"mobile"`, `"desktop"`
