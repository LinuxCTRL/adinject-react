# adinject-react — Scaling Roadmap

Notes on gaps to close before this scales, plus API sketches for the two highest-priority additions: consent-gated rendering and a pluggable ad-network adapter interface.

---

## Gaps to close before scaling

1. **No consent / GDPR handling.**
   For AdSense specifically, EU/UK traffic requires Google Consent Mode v2 (or at least a TCF hook) before ads render, or you risk policy violations. This is the single biggest missing piece.

2. **Accessibility.**
   Injected ad slots don't appear to carry `aria-label="Advertisement"` or an appropriate `role`. Screen readers should be told "this is an ad" — easy add, high value.

3. **Single ad network.**
   Everything is AdSense-shaped (`ca-pub-...`, `slot`). An adapter pattern (AdSense / GAM / Ezoic / Mediavine) would widen adoption a lot, since publishers switch networks constantly.

4. **`injectAffiliateKeywords` on raw HTML.**
   Auto-linking keywords in body content is powerful but is exactly the kind of "over-optimization" pattern Google's helpful-content guidance has gotten stricter about. Worth documenting the risk and adding a density guard (e.g. "max N links per 1000 words"), not just a flat per-article cap.

5. **No test suite / CI badge in the README.**
   For something manipulating layout and revenue-critical UI, publishers will want to see tests before trusting it in prod.

6. **No idempotency guard.**
   Unclear what happens if `injectFeedAds` / `injectPortableTextAds` runs twice on a re-render or during SPA navigation — worth confirming behavior and documenting it, or adding a guard.

---

## 1. Consent-gated rendering

Goal: no ad network script or slot fires until consent is granted (Google Consent Mode v2 / IAB TCF), and the API should degrade gracefully (e.g. render nothing, a placeholder, or an affiliate fallback) when consent is denied.

### Shape

```tsx
import { AdInjectFeed, ConsentProvider, useConsent } from "adinject-react";

// 1. Wrap the app (or the ad-bearing subtree) once
<ConsentProvider
  mode="google-consent-v2"      // "google-consent-v2" | "tcf" | "custom"
  // Called to determine current consent state — you wire this to your CMP
  getConsent={() => window.__cmp?.getConsentState()}
  // Optional: re-check on this event name (fired by your CMP)
  listenEvent="consent_updated"
>
  <App />
</ConsentProvider>

// 2. Ad components auto-respect consent
<AdInjectFeed
  items={recipes}
  interval={3}
  renderItem={(r) => <RecipeCard key={r.id} recipe={r} />}
  // What to show in an ad slot's place while consent is unresolved/denied
  fallback="affiliate"          // "affiliate" | "placeholder" | "hidden" | ReactNode
/>

// 3. Escape hatch for custom UI (e.g. a "personalize ads" banner)
function ConsentBanner() {
  const { status, grant, deny } = useConsent();
  if (status !== "unknown") return null;
  return (
    <div>
      <button onClick={grant}>Accept</button>
      <button onClick={deny}>Decline</button>
    </div>
  );
}
```

### Types

```ts
type ConsentStatus = "unknown" | "granted" | "denied";

interface ConsentContextValue {
  status: ConsentStatus;
  grant: () => void;
  deny: () => void;
}

interface ConsentProviderProps {
  mode: "google-consent-v2" | "tcf" | "custom";
  getConsent: () => ConsentStatus | Promise<ConsentStatus>;
  listenEvent?: string;
  children: React.ReactNode;
}

type AdFallback = "affiliate" | "placeholder" | "hidden" | React.ReactNode;
```

### Behavior notes
- `AdInjectFeed`/`AdSenseSlot`/etc. should never mount the underlying ad network script until `status === "granted"`.
- When `status === "denied"`, the `fallback="affiliate"` option lets a publisher swap the slot for an `AffiliateCard` automatically — keeps monetization without violating consent.
- `google-consent-v2` mode should push `ad_storage`/`analytics_storage` updates via `gtag('consent', 'update', ...)` under the hood so it plays nicely with existing GA/GTM setups.

---

## 2. Ad-network adapter interface

Goal: decouple ad rendering from AdSense specifically, so GAM, Ezoic, Mediavine, or a custom network can be swapped in without touching `AdInjectFeed`/`injectFeedAds` call sites.

### Shape

```tsx
import { AdInjectFeed, createAdAdapter, adsenseAdapter, gamAdapter } from "adinject-react";

// Built-in adapters ship for common networks
const adapter = adsenseAdapter({
  client: "ca-pub-1234567890123456",
});

// Or roll your own
const customAdapter = createAdAdapter({
  name: "my-network",
  render: ({ slot, format, responsive }) => (
    <MyNetworkTag slotId={slot} format={format} responsive={responsive} />
  ),
  // Optional: called once per page to inject the network's loader script
  loadScript: () => injectScriptOnce("https://cdn.mynetwork.com/loader.js"),
});

<AdInjectFeed
  items={recipes}
  interval={3}
  adapter={adapter}            // <- network-agnostic from here down
  renderItem={(r) => <RecipeCard key={r.id} recipe={r} />}
/>
```

### Types

```ts
interface AdAdapter {
  name: string;
  render: (props: AdSlotProps) => React.ReactNode;
  loadScript?: () => void | Promise<void>;
}

interface AdSlotProps {
  slot: string;
  format?: "rectangle" | "leaderboard" | "responsive" | string;
  responsive?: boolean;
  client?: string;             // network account/publisher id, adapter-specific
}

function createAdAdapter(config: AdAdapter): AdAdapter;

// Shipped adapters
function adsenseAdapter(opts: { client: string }): AdAdapter;
function gamAdapter(opts: { networkCode: string }): AdAdapter;
function ezoicAdapter(opts: { siteId: string }): AdAdapter;
```

### Behavior notes
- `AdInjectFeed`, `injectFeedAds`, and `injectPortableTextAds` all accept an `adapter` prop/option instead of the current `client`/`slot`-only shape — keep `client`/`slot` working as a deprecated shorthand that internally wraps `adsenseAdapter` for backward compat.
- `loadScript` should be called at most once per page regardless of how many ad slots render (dedupe by adapter `name`).
- Combine with the consent gate above: `loadScript` should itself be gated on consent status, not just the render.

---

## Smaller adds worth scheduling alongside these

- `aria-label="Advertisement"` / `role="complementary"` on every rendered ad slot (accessibility gap above) — small, ship it with either of the two features above.
- `useAdMetrics` hook exposing actual viewability (not just render count) via the existing `IntersectionObserver` plumbing — publishers will want this once they're running experiments.
- Idempotency guard on `injectFeedAds`/`injectPortableTextAds` — cheap insurance against double-injection on SPA nav or re-render.




# New Update :
# adinject-react — Scaling Roadmap

Status of the original gaps list, API sketches for what's still open (accessibility + idempotency), and further additions to keep ad delivery aligned with IAB/industry-standard patterns as this scales.

---

## Gaps — status

1. ✅ **Consent / GDPR handling** — shipped in 1.0.3 (`<ConsentProvider mode="google-consent-v2">`, `useConsent`, automatic affiliate fallback on denial).
2. ⬜ **Accessibility** — still open. Ad slots don't carry `aria-label`/`role`. Sketch below.
3. ✅ **Single ad network** — shipped in 1.0.3 (`createAdAdapter`, `adsenseAdapter`, `gamAdapter`, Ezoic/Mediavine).
4. ⬜ **`injectAffiliateKeywords` density guard** — still only has `maxLinksTotal`; no per-1000-words cap. Higher priority now that the package markets itself as compliance-focused.
5. ⬜ **Test suite / CI badge** — still nothing in the README. More important now that consent + adapters + metrics widen the revenue-critical surface area.
6. ⬜ **Idempotency guard** — still open. Sketch below.

---

## 1. Accessibility layer

Goal: every rendered ad/affiliate slot is announced correctly to assistive tech and doesn't trap focus or break heading/landmark structure — this is also an AdSense/GAM policy expectation, not just an a11y nicety.

### Shape

```tsx
import { AdInjectFeed, AdSenseSlot } from "adinject-react";

// Applied automatically by every built-in slot component —
// no API change required for existing users
<AdSenseSlot
  client="ca-pub-1234567890123456"
  slot="9876543210"
  format="rectangle"
  // Optional overrides, sensible defaults otherwise
  a11yLabel="Advertisement"        // default: "Advertisement"
  a11yRole="complementary"         // default: "complementary"
/>
```

Rendered output (illustrative):

```html
<div role="complementary" aria-label="Advertisement" data-adinject-slot="ad-3">
  <!-- network tag mounts here -->
</div>
```

### Behavior notes
- Applies to `AdSenseSlot`, `InFeedAdCard`, `AffiliateCard`, and `AffiliateEquipmentBox` uniformly — one shared `<AdSlotFrame>` wrapper internally so the labeling logic lives in one place instead of four.
- `AffiliateCard`/`AffiliateEquipmentBox` should use `aria-label="Sponsored product"` rather than "Advertisement" — screen reader users benefit from knowing it's a paid product link, not a display ad.
- Skip-friendly: injected ad slots inside a feed/grid shouldn't be individually tab-stoppable containers if they hold no interactive content themselves — only the actual link/button inside should be focusable, so keyboard users aren't forced to tab through empty ad wrappers.
- Respect `prefers-reduced-motion` for any ad-load transition/fade the package adds.

---

## 2. Idempotency guard

Goal: `injectFeedAds`, `injectPortableTextAds`, and `injectAffiliateKeywords` are safe to call more than once against the same input (re-render, SPA route re-entry, React StrictMode double-invoke) without duplicating ad slots or affiliate links.

### Shape

```tsx
import { injectFeedAds } from "adinject-react";

const feedWithAds = injectFeedAds({
  items: recipes,
  rule: { itemInterval: 3, startOffset: 1, maxAdsPerFeed: 4 },
  adUnit: { client: "...", slot: "..." },
  // New: stable key so repeated calls on the same logical feed are detected
  idempotencyKey: "recipe-grid-page-1",
});
```

### Behavior notes
- Internally, keep a `WeakMap`/module-level cache keyed by `idempotencyKey` (or a content hash of `items` when no key is given) storing the last computed ad-interleaved output.
- On a repeat call with the same key/hash, return the cached result instead of recomputing/re-tagging — this also protects `maxAdsPerFeed`/`maxLinksTotal` caps from silently doubling across re-renders.
- For `injectAffiliateKeywords`, guard against re-scanning HTML that already contains `data-adinject-affiliate` markers from a prior pass, so nested/rerun calls can't stack links on top of links.
- Document the guarantee explicitly in the README ("safe to call on every render") — this is as much a trust signal for adopters as it is a bug fix.

---

## 3. Consent-gated rendering (shipped in 1.0.3 — reference)

```tsx
import { ConsentProvider, AdInjectFeed, useConsent } from "adinject-react";

<ConsentProvider
  mode="google-consent-v2"
  getConsent={() => window.__cmp?.getConsentState()}
  listenEvent="consent_updated"
>
  <App />
</ConsentProvider>
```

---

## 4. Ad-network adapters (shipped in 1.0.3 — reference)

```tsx
import { AdInjectFeed, gamAdapter } from "adinject-react";

const adapter = gamAdapter({ networkCode: "12345678" });

<AdInjectFeed items={recipes} interval={3} adapter={adapter} renderItem={...} />
```

---

## Further additions — aligned to IAB / industry-standard ad-delivery patterns

These go beyond the original gap list and point toward the package behaving like a "good citizen" ad-delivery layer, matching patterns publishers/ad networks already expect:

- **GPP (Global Privacy Platform) string support.** IAB is consolidating TCF, US state privacy strings, etc. into the GPP framework. `ConsentProvider` currently supports `"google-consent-v2" | "tcf" | "custom"` — adding `"gpp"` as a mode now avoids a breaking migration later, since GPP is where the industry is headed.
- **`ads.txt` / `app-ads.txt` awareness.** Not something the React layer enforces, but a small CLI check (`npx adinject-react verify-ads-txt`) that confirms the configured `client`/`networkCode` values are actually declared in the site's `ads.txt` would catch a very common (and costly) misconfiguration before it hits production.
- **Ad refresh policy compliance.** If ad refresh (re-serving a slot without a full page load) is ever added, it needs a minimum refresh interval and a visibility requirement (slot must be in-view) baked in as a default — Google AdX/AdSense policy explicitly disallows refreshing hidden or sub-30-second slots. Worth a hard-coded floor rather than leaving it fully configurable.
- **Frequency capping across sessions, not just per-page.** `maxAdsPerFeed`/`maxAdsPerArticle` cap a single render, but nothing caps how many *affiliate* impressions a given user sees per session/day. A lightweight `frequencyCap: { scope: "session" | "day", max: N }` option on `AffiliateCard`/`AffiliateEquipmentBox` would bring affiliate delivery in line with how display ad frequency capping normally works.
- **Invalid traffic (IVT) guard.** A basic bot/headless-browser check before counting a `useAdMetrics` impression as viewable would protect publishers' relationship with their ad network — most networks (AdSense included) hold publishers responsible for IVT regardless of the tooling used.
- **IAB content taxonomy hook.** An optional `contentCategory` prop (mapped to IAB Content Taxonomy 3.0 categories) passed down to the adapter would let contextual networks (GAM, Ezoic) target more accurately without relying on third-party cookies — increasingly the only signal available post-cookie-deprecation.
- **Core Web Vitals regression guard in dev mode.** Since zero-CLS is already a core selling point, a dev-only console warning when an ad slot's reserved aspect-ratio box doesn't match its actual rendered network creative (common cause of late CLS) would help publishers catch regressions before shipping, not after Search Console flags them.

### Suggested priority order
1. Accessibility layer (cheap, immediate, matches network policy expectations)
2. Idempotency guard (cheap, prevents a real class of production bugs)
3. Affiliate keyword density guard (closes the SEO-risk gap directly)
4. GPP mode + frequency capping (near-term industry direction)
5. Test suite / CI (trust signal, unblocks the rest being adopted confidently)
6. ads.txt verification CLI + IVT guard + content taxonomy hook (nice-to-have, differentiators)