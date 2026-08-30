# Consent & Privacy (GDPR, GPP, TCF)

Monetizing traffic in the EU, UK, and US states with privacy legislation (CCPA/CPRA) requires strict consent gating. Running ad network scripts before consent is granted exposes publishers to policy violations and legal liabilities.

`adinject-react` includes a built-in privacy state machine supporting **Google Consent Mode v2**, **IAB Global Privacy Platform (GPP)**, and **IAB TCF v2**.

---

## 1. Consent State Machine Architecture

```
                  ┌───────────────────────┐
                  │   <ConsentProvider>   │
                  └───────────┬───────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
     Google Consent v2     IAB GPP          IAB TCF v2
      (gtag / dataLayer) (window.__gpp) (window.__tcfapi)
             │                │                │
             └────────────────┼────────────────┘
                              │
                    Consent Status Check
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
       ["granted"]                         ["denied"]
            │                                   │
   Load Ad Network Tags                Zero Tracking Cookies
  (AdSense, GAM, Ezoic)                 Render Affiliate Card
                                         or Static Placeholder
```

---

## 2. Configuration Modes

### Mode 1: Google Consent Mode v2 (`mode="google-consent-v2"`)
Automatically updates Google Consent Mode v2 state via `window.gtag("consent", "update", ...)` and `window.dataLayer`:

```tsx
import { ConsentProvider, AdInjectProvider } from "adinject-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider
      mode="google-consent-v2"
      // Connect to your Cookie Management Platform (OneTrust, Cookiebot, Klaro, etc.)
      getConsent={() => {
        if (typeof window === "undefined") return "unknown";
        return window.localStorage.getItem("cookie_consent") === "true" ? "granted" : "denied";
      }}
      listenEvent="consent_status_changed"
    >
      <AdInjectProvider client="ca-pub-1234567890123456">
        {children}
      </AdInjectProvider>
    </ConsentProvider>
  );
}
```

When status transitions to `"granted"`, `adinject-react` automatically synchronizes:
* `ad_storage`: `"granted"`
* `ad_user_data`: `"granted"`
* `ad_personalization`: `"granted"`
* `analytics_storage`: `"granted"`

### Mode 2: IAB Global Privacy Platform (`mode="gpp"`)
Automatically attaches listeners to `window.__gpp("addEventListener", ...)` and resolves signals across US State and international sections.

```tsx
<ConsentProvider mode="gpp">
  <App />
</ConsentProvider>
```

### Mode 3: IAB Transparency and Consent Framework (`mode="tcf"`)
Listens to `window.__tcfapi("addEventListener", 2, ...)` and verifies Purpose 1 consent before executing scripts.

```tsx
<ConsentProvider mode="tcf">
  <App />
</ConsentProvider>
```

---

## 3. The `useConsent()` Hook

Use `useConsent()` in your custom banner or settings modal to read the current status and update user preferences:

```tsx
"use client";

import { useConsent } from "adinject-react";

export function CustomCookieBanner() {
  const { status, grant, deny, reset } = useConsent();

  // Hide banner if user has already made a choice
  if (status !== "unknown") return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-xl bg-card border shadow-lg flex items-center justify-between gap-4">
      <p className="text-sm text-foreground">
        We use cookies to deliver personalized advertising and improve your experience.
      </p>
      <div className="flex gap-2">
        <button
          onClick={grant}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
        >
          Accept All
        </button>
        <button
          onClick={deny}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground"
        >
          Reject Non-Essential
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Graceful Degradation (`consentFallback`)

When consent is denied, `adinject-react` does not break the layout or leave blank holes. Instead, you can specify a fallback strategy on `<AdSenseSlot />`:

```tsx
<AdSenseSlot
  slot="9876543210"
  consentFallback="affiliate" // "affiliate" | "placeholder" | "hidden" | ReactNode
  fallback={{
    id: "cookware-set",
    name: "Non-Stick Cookware Set",
    type: "custom_cta",
    targetUrl: "https://shop.example.com/cookware",
    title: "Chef Recommended Cookware",
    ctaText: "Shop Deal",
  }}
/>
```

| Strategy | Behavior on Consent Denied |
| :--- | :--- |
| `"affiliate"` | Swaps the slot into a zero-cookie static affiliate product card. Preserves layout & revenue! |
| `"placeholder"` | Renders a neutral placeholder ("Consent Required for Personalized Ads") preserving exact height. |
| `"hidden"` | Collapses the slot container cleanly. |
| Custom JSX | Renders any custom React component you pass. |

---

## 5. Zero-Telemetry Guarantee

`adinject-react` is strictly a first-party client library:
- **No Analytics Beacons**: No requests are sent to AdInject servers unless you explicitly call `fetchAdInjectConfig()`.
- **No Third-Party Cookies**: No tracking cookies are set by `adinject-react`.
- **No Fingerprinting**: No canvas, audio, or hardware fingerprinting techniques are used.
