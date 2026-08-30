# Transformers & Content Adapters

`adinject-react` includes a powerful suite of AST and string transformers to inject ads and affiliate links into raw content before rendering.

---

## Transformer Summary

| Function | Input Type | Output Type | Primary Use Case |
| :--- | :--- | :--- | :--- |
| `injectFeedAds()` | `T[]` (Array) | `FeedItem<T>[]` | Interleaving ad cards into product/recipe arrays. |
| `injectHtmlAds()` | `string` (HTML) | `AdInjectionResult<string>` | Placing ad markers into CMS HTML strings. |
| `splitHtmlForAds()` | `string` (HTML) | `HtmlChunk[]` | Splitting HTML into React-renderable JSX segments. |
| `injectMarkdownAds()` | `string` (MD) | `AdInjectionResult<string>` | Injecting ad components into Markdown/MDX. |
| `injectPortableTextAds()` | `PortableTextBlock[]` | `AdInjectionResult` | Injecting custom ad blocks into Sanity CMS AST. |
| `injectPortableTextAffiliate()` | `PortableTextBlock[]` | `PortableTextBlock[]` | Injecting affiliate cards into Sanity CMS AST. |
| `injectAffiliateKeywords()` | `string` (HTML / MD) | `string` | Autolinking product keywords with density caps. |

---

## 1. Array Feed Inserter (`injectFeedAds` & `isAdSlot`)

Interleaves ad slots into an array with strict idempotency guards.

### Type Signature
```ts
function injectFeedAds<T>(options: {
  items: T[];
  rule?: PlacementRule;
  adUnit?: AdUnit;
  adUnits?: Record<string, AdUnit>;
  idempotencyKey?: string;
}): FeedItem<T>[];
```

### Usage
```tsx
import { injectFeedAds, isAdSlot, InFeedAdCard } from "adinject-react";

export function CustomProductGrid({ products }: { products: Product[] }) {
  const feedItems = injectFeedAds({
    items: products,
    rule: {
      itemInterval: 4,      // Ad card every 4 products
      startOffset: 2,       // First ad after product #2
      maxAdsPerFeed: 3,     // Cap at 3 ads
      gridSpan: "card",
      enabled: true,
    },
    adUnit: {
      client: "ca-pub-1234567890123456",
      slot: "9876543210",
      format: "fluid",
    },
    idempotencyKey: "products-grid-page-1",
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {feedItems.map((item, index) => {
        if (isAdSlot(item)) {
          return (
            <InFeedAdCard
              key={`feed-ad-${item.slotIndex}`}
              adUnit={item.adUnit}
              slotIndex={item.slotIndex}
              gridSpan={item.gridSpan}
            />
          );
        }
        return <ProductCard key={item.data.id} product={item.data} />;
      })}
    </div>
  );
}
```

---

## 2. HTML In-Article Inserter (`injectHtmlAds` & `splitHtmlForAds`)

Injects ad markers after paragraphs while respecting safety rules (min words, excluded tags).

### Usage with Template String
```ts
import { injectHtmlAds } from "adinject-react";

const result = injectHtmlAds({
  html: articleHtml,
  rule: {
    paragraphInterval: 3,
    minWordsBeforeFirstAd: 150,
    minParagraphsTotal: 4,
    maxAdsPerArticle: 3,
    excludedSelectors: ["blockquote", ".recipe-card"],
    enabled: true,
  },
  adUnit: { client: "ca-pub-1234567890123456", slot: "9876543210" },
});

console.log(result.content); // Transformed HTML string with <ins class="adsbygoogle"> injected
console.log(result.totalWords); // Total words counted in article
console.log(result.totalParagraphs); // Total paragraphs detected
```

---

## 3. Markdown / MDX Inserter (`injectMarkdownAds`)

Safely injects ad markers between markdown paragraphs without breaking code blocks, headings, or blockquotes.

### Usage
```ts
import { injectMarkdownAds } from "adinject-react";

const result = injectMarkdownAds({
  markdown: postMarkdown,
  rule: {
    paragraphInterval: 2,
    minWordsBeforeFirstAd: 100,
    maxAdsPerArticle: 2,
    enabled: true,
  },
  adUnit: { client: "ca-pub-1234567890123456", slot: "9876543210" },
  customAdMarker: (slot) => `\n\n<AdSenseSlot slot="${slot.adUnit.slot}" />\n\n`,
});
```

---

## 4. Sanity Portable Text Adapter (`injectPortableTextAds`)

Inserts custom `adinject.adSlot` blocks directly into Sanity's Portable Text AST.

### Server Component + PortableText Renderer
```tsx
import { injectPortableTextAds, AdSenseSlot } from "adinject-react";
import { PortableText } from "@portabletext/react";

export default async function BlogPost({ post }: { post: SanityPost }) {
  const transformed = injectPortableTextAds({
    blocks: post.body,
    rule: {
      paragraphInterval: 3,
      minWordsBeforeFirstAd: 120,
      maxAdsPerArticle: 3,
      enabled: true,
    },
    adUnit: { client: "ca-pub-1234567890123456", slot: "9876543210" },
  });

  const ptComponents = {
    types: {
      "adinject.adSlot": ({ value }: { value: any }) => (
        <div className="my-8">
          <AdSenseSlot client={value.adUnit.client} slot={value.adUnit.slot} />
        </div>
      ),
    },
  };

  return <PortableText value={transformed.content} components={ptComponents} />;
}
```

---

## 5. Keyword Autolinker (`injectAffiliateKeywords`)

Automatically transforms article keywords into FTC-compliant affiliate links with density caps to protect against search engine over-optimization penalties.

### Density Guard
`maxLinksPerThousandWords` ensures that short articles don't get stuffed with too many links:

```ts
import { injectHtmlAffiliateKeywords } from "adinject-react";

const monetizedHtml = injectHtmlAffiliateKeywords(articleHtml, {
  rules: [
    {
      keyword: ["air fryer", "air-fryer"],
      targetUrl: "https://amazon.com/dp/B08...?tag=mytag-20",
      maxReplacements: 1,
    },
    {
      keyword: "chef knife",
      targetUrl: "https://amazon.com/dp/B07...?tag=mytag-20",
      maxReplacements: 1,
    },
  ],
  maxLinksTotal: 4,
  maxLinksPerThousandWords: 2, // Maximum 2 affiliate links per 1,000 words
  linkClassName: "affiliate-link underline text-primary font-medium",
  idempotencyKey: `article-${article.id}`,
  onKeywordMatched: (kw, url) => console.log(`Matched: ${kw} -> ${url}`),
});
```
