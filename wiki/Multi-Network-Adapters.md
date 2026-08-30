# Multi-Network Adapters

`adinject-react` is completely network-agnostic. While Google AdSense is the default out-of-the-box provider, you can plug in Google Ad Manager (GAM), Ezoic, Mediavine, Prebid.js, or your own custom direct ad server.

---

## 1. Built-in Adapters

### Google AdSense Adapter (`adsenseAdapter`)
```tsx
import { AdInjectFeed, adsenseAdapter } from "adinject-react";

const adapter = adsenseAdapter({
  client: "ca-pub-1234567890123456",
  testMode: process.env.NODE_ENV !== "production",
});

<AdInjectFeed items={recipes} adapter={adapter} renderItem={...} />
```

### Google Ad Manager / GPT Adapter (`gamAdapter`)
Loads `gpt.js` once and mounts GAM target `<div>` containers matching your network code:

```tsx
import { AdInjectFeed, gamAdapter } from "adinject-react";

const gam = gamAdapter({
  networkCode: "12345678",
  testMode: process.env.NODE_ENV !== "production",
});

<AdInjectFeed
  items={recipes}
  adapter={gam}
  adUnit={{ id: "unit-1", slot: "recipes_grid_infeed", name: "InFeed" }}
  renderItem={...}
/>
```

### Ezoic Adapter (`ezoicAdapter`)
Loads the Ezoic standalone script (`sa.min.js`) and creates designated placeholder elements:

```tsx
import { AdInjectFeed, ezoicAdapter } from "adinject-react";

const ezoic = ezoicAdapter({
  siteId: "123456",
  testMode: false,
});

<AdInjectFeed
  items={recipes}
  adapter={ezoic}
  adUnit={{ id: "ezoic-101", slot: "101", name: "Ezoic Mid-Feed" }}
  renderItem={...}
/>
```

---

## 2. Authoring a Custom Ad Adapter (`createAdAdapter`)

You can create an adapter for any third-party network, header bidding wrapper, or custom sponsor by supplying a `name`, `render`, and optional `loadScript` callback.

### Mediavine Adapter Example

```tsx
import { createAdAdapter } from "adinject-react";

export function mediavineAdapter(opts: { siteId: string }) {
  return createAdAdapter({
    name: "mediavine",
    loadScript: () => {
      if (document.querySelector(`script[src*="mediavine.com"]`)) return;
      const script = document.createElement("script");
      script.src = `https://scripts.mediavine.com/tags/${encodeURIComponent(opts.siteId)}.js`;
      script.async = true;
      document.head.appendChild(script);
    },
    render: ({ slot, dimensions, className, style }) => {
      return (
        <div
          data-push-ad={slot}
          className={`mediavine-ad-container ${className || ""}`}
          style={{
            minHeight: dimensions?.minHeight || "250px",
            width: "100%",
            ...style,
          }}
        />
      );
    },
  });
}
```

### Direct Sponsor / Banner Adapter Example

```tsx
import { createAdAdapter } from "adinject-react";

export function directSponsorAdapter(sponsorData: {
  imageUrl: string;
  targetUrl: string;
  campaignTitle: string;
}) {
  return createAdAdapter({
    name: "direct-sponsor",
    render: ({ dimensions, className, style }) => (
      <a
        href={sponsorData.targetUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={`sponsor-banner rounded-xl overflow-hidden block ${className || ""}`}
        style={{ minHeight: dimensions?.minHeight || "250px", ...style }}
      >
        <img
          src={sponsorData.imageUrl}
          alt={sponsorData.campaignTitle}
          className="w-full h-full object-cover"
        />
      </a>
    ),
  });
}
```

---

## 3. Global Script Deduplication (`loadScriptOnce`)

When custom adapters supply a `loadScript` function, `adinject-react` ensures it runs **at most once per page lifecycle** across hundreds of mounted ad slots:

```ts
import { loadScriptOnce } from "adinject-react";

// Safe to call anywhere: duplicate calls with the same adapterName are ignored
loadScriptOnce("my-ad-network", () => {
  const script = document.createElement("script");
  script.src = "https://cdn.example.com/tag.js";
  document.head.appendChild(script);
});
```
