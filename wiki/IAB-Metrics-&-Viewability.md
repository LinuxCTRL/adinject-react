# IAB Metrics & Viewability Tracking

Advertisers pay higher CPM rates when ad placements achieve high viewability scores. The Interactive Advertising Bureau (IAB) and Media Rating Council (MRC) standard requires that **at least 50% of an ad's pixels be visible in the viewport for at least 1 continuous second**.

`adinject-react` includes a dedicated viewability and impression tracking hook: `useAdMetrics()`.

---

## 1. Overview & Key Capabilities

- 🎯 **IAB Standard Conformance**: Triggers viewability only when threshold ($\ge 50\%$) and continuous duration ($\ge 1000\text{ms}$) criteria are met.
- 🤖 **Invalid Traffic (IVT) Bot Guard**: Detects automated headless browsers, web scrapers, and crawler user-agents to protect publisher standing with ad networks.
- ⚡ **Zero-Overhead IntersectionObserver**: Uses native browser intersection observers with continuous timer sampling.
- 📊 **Precision Viewable Duration**: Exposes active continuous view duration in milliseconds.

---

## 2. The `useAdMetrics()` Hook

### Hook Options & Return Values

```ts
interface UseAdMetricsOptions {
  threshold?: number;            // Viewport intersection ratio (default: 0.5)
  viewableTimeMs?: number;       // Continuous time in ms (default: 1000ms)
  filterInvalidTraffic?: boolean;// Bot detection filter (default: true)
  onImpression?: () => void;     // Fires on first pixel intersection
  onViewable?: () => void;       // Fires when 50% is visible for >= 1s
}

interface UseAdMetricsReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  isIntersecting: boolean;
  isViewable: boolean;
  viewableDurationMs: number;
  isBotDetected: boolean;
}
```

---

## 3. Implementation Example

### Tracking Custom Ad Creatives or Sponsorships

```tsx
"use client";

import { useAdMetrics } from "adinject-react";

export function SponsorBanner({ sponsor }: { sponsor: SponsorData }) {
  const { ref, isViewable, viewableDurationMs, isBotDetected } = useAdMetrics({
    threshold: 0.5,
    viewableTimeMs: 1000,
    filterInvalidTraffic: true,
    onImpression: () => {
      console.log("[AdMetrics] Ad entered viewport");
    },
    onViewable: () => {
      console.log("[AdMetrics] IAB Viewability Milestone Achieved (50% for 1s)");
      // Track in GA4 or custom analytics endpoint
      if (typeof window.gtag === "function") {
        window.gtag("event", "ad_viewable_impression", {
          ad_unit_id: sponsor.id,
          slot_name: sponsor.name,
        });
      }
    },
  });

  if (isBotDetected) {
    // Optionally render non-interactive static version for bot crawlers
  }

  return (
    <div
      ref={ref}
      className={`sponsor-box p-6 border rounded-xl transition-all ${
        isViewable ? "border-emerald-500 shadow-md" : "border-border"
      }`}
    >
      <h4>{sponsor.title}</h4>
      <p>{sponsor.tagline}</p>
      {process.env.NODE_ENV !== "production" && (
        <span className="text-[10px] text-muted-foreground block mt-2 font-mono">
          Viewable: {isViewable ? "YES" : "NO"} | Time: {Math.round(viewableDurationMs / 1000)}s
        </span>
      )}
    </div>
  );
}
```

---

## 4. Invalid Traffic (IVT) Filtering

Ad networks strictly enforce policies against Invalid Traffic. `useAdMetrics` checks:
1. `navigator.webdriver` automation flags.
2. Bot/crawler patterns in `navigator.userAgent` (e.g. `HeadlessChrome`, `PhantomJS`, `Spider`, `Crawler`).

When automated traffic is detected:
* `isBotDetected` returns `true`.
* `onImpression` and `onViewable` callbacks are suppressed, preventing false analytics reporting.
