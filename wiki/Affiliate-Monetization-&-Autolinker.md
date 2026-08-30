# Affiliate Monetization & Autolinker

In addition to display ad units, `adinject-react` includes a complete, high-converting affiliate monetization suite designed specifically for recipe publishers, gear review blogs, and e-commerce editorial sites.

---

## 1. High-Converting Affiliate Cards (`<AffiliateCard />`)

`<AffiliateCard />` renders beautifully styled product cards that match modern Tailwind CSS and design systems:

```tsx
import { AffiliateCard } from "adinject-react";

const airFryer = {
  id: "cosori-airfryer",
  title: "COSORI Pro II 5.8-Qt Smart Air Fryer",
  targetUrl: "https://amazon.com/dp/B085W3C516?tag=ladyrecipes-20",
  description: "12 customizable cooking functions with rapid 360° air circulation.",
  price: 119.99,
  originalPrice: 139.99,
  currency: "$",
  rating: 4.7,
  reviewsCount: 38400,
  imageUrl: "/images/products/air-fryer.jpg",
  badgeText: "Editor's Choice",
  merchant: "Amazon",
  ctaText: "Check Price on Amazon",
};

// 1. Grid Catalog Card
<AffiliateCard product={airFryer} variant="card" />

// 2. Wide Horizontal In-Article Review Box
<AffiliateCard product={airFryer} variant="horizontal" />

// 3. Compact Row (Sidebar or Recipe Ingredients)
<AffiliateCard product={airFryer} variant="compact" />

// 4. Inline Pill Badge
<AffiliateCard product={airFryer} variant="minimal" />
```

---

## 2. Recipe Equipment Boxes (`<AffiliateEquipmentBox />`)

Place structured equipment and kitchen gadget lists at the top or bottom of recipe articles:

```tsx
import { AffiliateEquipmentBox } from "adinject-react";

export function RecipeEquipment({ items }: { items: AffiliateProduct[] }) {
  return (
    <AffiliateEquipmentBox
      title="Kitchen Tools Used in This Recipe"
      subtitle="Tested and recommended by our culinary team."
      products={items}
      columns={2}             // 1, 2, 3, or 4 columns
      variant="compact"       // "compact", "card", or "horizontal"
      disclosureText="We earn a commission if you make a purchase through these links."
    />
  );
}
```

---

## 3. FTC & Amazon Associates Disclosures (`<AffiliateDisclosure />`)

Compliance with Federal Trade Commission (FTC) and Amazon Associates Operating Agreement guidelines requires conspicuous disclosures before any affiliate link appears:

```tsx
import { AffiliateDisclosure } from "adinject-react";

// Standard Banner (Top of post)
<AffiliateDisclosure
  variant="banner"
  preset="amazon" // Automatically loads Amazon Associates required disclosure text
  policyUrl="/editorial-policy#affiliate"
  collapsible={false}
/>

// Subtle Compact Pill
<AffiliateDisclosure variant="compact" preset="standard" />

// Editorial Article Footer
<AffiliateDisclosure variant="footer" preset="standard" />

// Inline Note
<AffiliateDisclosure variant="inline" customText="Contains affiliate links." />
```

---

## 4. URL Builder with UTM & Sub-ID (`withAffiliateParams`)

Appends Amazon Associates tags, Sub-IDs, and UTM campaign parameters cleanly while preserving existing query strings:

```ts
import { withAffiliateParams } from "adinject-react";

const cleanAffiliateUrl = withAffiliateParams({
  url: "https://amazon.com/dp/B085W3C516?ref=sr_1_1",
  amazonTag: "ladyrecipes-20",
  subId: "summer_pasta_recipe",
  utmSource: "adinject",
  utmMedium: "recipe_card",
  utmCampaign: "dinner_series",
});

// Output:
// https://amazon.com/dp/B085W3C516?ref=sr_1_1&tag=ladyrecipes-20&subId=summer_pasta_recipe&subid=summer_pasta_recipe&utm_source=adinject&utm_medium=recipe_card&utm_campaign=dinner_series
```

---

## 5. Outbound Click Analytics (`trackAffiliateClick`)

Every click on an `<AffiliateCard />` or autolinked keyword fires both a local callback and a global browser `CustomEvent`:

```tsx
<AffiliateCard
  product={product}
  onAffiliateClick={(event) => {
    // Send to Google Analytics 4 (GA4) or PostHog
    if (typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", {
        product_id: event.productId,
        product_title: event.productTitle,
        merchant: event.merchant,
        placement: event.placement,
      });
    }
  }}
/>
```

### Global Window Listener
```ts
window.addEventListener("adinject:affiliate_click", (e: any) => {
  console.log("Outbound affiliate click:", e.detail);
});
```

---

## 6. Deterministic A/B Testing (`<AffiliateABSlot />`)

Test different price points, creative angles, or competing affiliate merchants:

```tsx
import { AffiliateABSlot } from "adinject-react";

const abTestConfig = {
  id: "air-fryer-pricing-test",
  seed: post.slug, // Deterministic SSR: users on the same page see consistent variant
  variants: [
    { id: "var_a", product: cosoriAirFryer, weight: 50 },
    { id: "var_b", product: ninjaAirFryer, weight: 50 },
  ],
};

<AffiliateABSlot test={abTestConfig} variant="horizontal" />
```

---

## 7. Automated Keyword Autolinker

Automatically links brand names, products, and ingredients in article copy:

```ts
import { injectHtmlAffiliateKeywords } from "adinject-react";

const output = injectHtmlAffiliateKeywords(articleHtml, {
  rules: [
    {
      keyword: ["cast iron skillet", "skillet"],
      targetUrl: "https://amazon.com/dp/B00006JSUA?tag=ladyrecipes-20",
      maxReplacements: 1, // Don't link more than once
    },
    {
      keyword: "dutch oven",
      targetUrl: "https://amazon.com/dp/B000N5016U?tag=ladyrecipes-20",
      maxReplacements: 1,
    },
  ],
  maxLinksTotal: 4,
  maxLinksPerThousandWords: 2, // Density guard against keyword stuffing
  skipTags: ["a", "code", "pre", "h1", "h2", "h3", "button"],
});
```
