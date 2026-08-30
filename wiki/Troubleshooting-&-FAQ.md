# Troubleshooting & FAQ

Frequently asked questions, common pitfalls, and resolution recipes when integrating `adinject-react`.

---

## 1. Common Errors & Solutions

### ⚠️ Issue: `TypeError: useRef only works in Client Components`
* **Root Cause**: You called `<AdSenseSlot />` or another client component directly inside an async Server Component page without importing it properly or missing client boundaries.
* **Solution**: Ensure your component files use `"use client"` at the top if they wrap hooks or local state:
```tsx
// src/components/blog-ad.tsx
"use client";

import { AdSenseSlot } from "adinject-react";

export function BlogSidebarAd() {
  return <AdSenseSlot slot="9876543210" format="rectangle" />;
}
```

---

### ⚠️ Issue: Ads do not render on initial page load
Check the following checklist:
1. **Consent State**: Did user grant consent? If `ConsentProvider` is in `"unknown"` or `"denied"` state, ad network tags are blocked by design.
2. **Ad Blockers**: Verify if a browser ad blocker (uBlock Origin, Brave Shields) is active. With an ad blocker active, the component will safely render your configured `<AdFallback />`.
3. **Publisher ID & Slot**: Double check that `ca-pub-XXXXXXXXXXXXXXXX` and slot ID match your verified Google AdSense / GAM dashboard.
4. **AdSense Account Status**: New AdSense sites must be reviewed and approved by Google before live creatives display. In development, use `testMode={true}` to verify layout stability without requiring an active AdSense approval.

---

### ⚠️ Issue: Warning in browser console: `[AdInject CLS Guard] Ad slot #... rendered at ...px but reserved ...px`
* **Root Cause**: In development mode, `adinject-react` checks the actual creative height against the reserved min-height bounding box. If the ad network serves a creative of a different size (e.g. 300x600 inside a 300x250 container), layout shift could occur.
* **Solution**: Specify custom dimensions on the slot to match the creative served:
```tsx
<AdSenseSlot
  slot="9876543210"
  format="rectangle"
  dimensions={{ minHeight: 280, aspectRatio: "336/280" }}
/>
```

---

### ⚠️ Issue: Ad tags fire multiple times on route navigation
* **Explanation**: `adinject-react` uses an internal script deduplication registry (`loadScriptOnce`) and idempotent cache (`idempotencyKey`). `AdSenseScript` in `app/layout.tsx` guarantees that the Google script is attached to `document.head` exactly once per browser session.

---

## 2. Best Practices for Google AdSense & Publisher Compliance

1. **Avoid Accidental Clicks**: Do not place ad slots directly above or below primary navigation buttons, search inputs, or pagination controls. Maintain at least `16px` to `24px` margin.
2. **Ad Density**: Ensure advertising does not exceed 30% of total visible page content. `<InArticleAds />` and `injectFeedAds` let you control intervals (`interval={3}` or `interval={4}`) to maintain compliant density.
3. **Accessibility**: Every ad slot rendered by `adinject-react` carries `role="complementary"` and `aria-label="Advertisement"` to announce sponsored content to screen readers.
4. **FTC Disclosures**: Always place `<AffiliateDisclosure />` near the top of the article before any affiliate links or product cards appear.
