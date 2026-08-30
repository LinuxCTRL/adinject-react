# Welcome to the `adinject-react` Wiki 🚀

[![npm version](https://img.shields.io/npm/v/adinject-react?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/adinject-react)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue?style=flat-square)](https://www.typescriptlang.org/)
[![0 Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)](https://www.npmjs.com/package/adinject-react)
[![Next.js](https://img.shields.io/badge/Next.js-14--16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![CLS Safe](https://img.shields.io/badge/CLS-Safe%20by%20Design-purple?style=flat-square)](https://web.dev/cls/)
[![Consent v2 + GPP](https://img.shields.io/badge/Consent%20Mode-v2%20%2B%20GPP-orange?style=flat-square)](https://support.google.com/google-ads/answer/10000067)
[![MIT License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://github.com/LinuxCTRL/adinject-react/blob/main/LICENSE)

> **`adinject-react` is a zero-dependency headless ad monetization and content insertion engine built natively for Next.js App Router (Next 14–16) and React 19.**

It provides a unified, deterministic framework to insert display ads, native feed slots, affiliate product cards, and equipment lists into articles and item grids with **zero Cumulative Layout Shift (0.000 CLS)**, consent-aware gating (GDPR / Google Consent Mode v2 / IAB GPP), multi-network support (AdSense, GAM, Ezoic, Custom), and automated affiliate fallbacks for blocked or unfilled inventory.

---

## 🌟 Key Differentiators

| Capability | What `adinject-react` Delivers |
| :--- | :--- |
| **0 Dependencies** | Pure native TypeScript with zero runtime `node_modules` dependencies for lightning-fast build & load times. |
| **CLS-Safe by Design** | Pre-allocates exact aspect-ratio bounding boxes before ad network scripts execute to maintain a **0.000 CLS** Core Web Vitals score. |
| **Consent Gated** | Gated on Google Consent Mode v2, IAB GPP, and TCF v2. No ad network script executes when consent is denied or pending. |
| **Automatic Fallback** | Unfilled, errored, or consent-denied ad slots automatically swap into high-converting affiliate product cards or custom CTAs. |
| **Multi-Network** | Pluggable network adapter pattern supporting Google AdSense, Google Ad Manager (GAM/GPT), Ezoic, or custom networks. |
| **Idempotent Caching** | Safe to call across re-renders, SPA route navigations, and React StrictMode without duplicate ads or keyword links. |
| **Zero External Telemetry** | 100% first-party code execution with zero analytics, tracking beacons, or third-party phone-home requests. |

---

## 🧭 Wiki Table of Contents

Explore the complete documentation sections:

1. **[Quick Start](Getting-Started)**  
   *Step-by-step installation, peer dependencies, root layout setup, and first ad insertion.*
2. **[Architecture & Core Concepts](Architecture-&-Core-Concepts)**  
   *The headless philosophy, placement pipeline, zero-CLS layout calculations, and RSC boundaries.*
3. **[Components Reference](Components-Reference)**  
   *Complete API documentation, props, and examples for all 12 React components.*
4. **[Transformers & Content Adapters](Transformers-&-Content-Adapters)**  
   *AST & string manipulators for HTML, Markdown/MDX, Sanity Portable Text, and Feed arrays.*
5. **[Multi-Network Adapters](Multi-Network-Adapters)**  
   *Connecting Google AdSense, Google Ad Manager (GAM), Ezoic, or authoring custom ad adapters.*
6. **[Consent & Privacy (GDPR, GPP, TCF)](Consent-&-Privacy-(GDPR,-GPP,-TCF))**  
   *Configuring Google Consent Mode v2, IAB Global Privacy Platform, and cookie-free fallback banners.*
7. **[Affiliate Monetization & Autolinker](Affiliate-Monetization-&-Autolinker)**  
   *Affiliate product cards, equipment boxes, FTC disclosures, keyword autolinking, and deterministic A/B testing.*
8. **[IAB Metrics & Viewability Tracking](IAB-Metrics-&-Viewability)**  
   *Measuring 50%/1s IAB viewability milestones, active duration, and Invalid Traffic (IVT) bot filtering.*
9. **[Live Edge Config API](Live-Edge-Config-API)**  
   *Dynamic remote configuration via AdInject Edge API with ISR revalidation and exponential backoff.*
10. **[Companion Visual DevTools](Visual-DevTools)**  
    *Using `adinject-devtools` for point-and-click placement, AI prompt generation, and policy auditing.*
11. **[Troubleshooting & FAQ](Troubleshooting-&-FAQ)**  
    *Solutions to common setup issues, server-client boundary errors, and ad blocker debugging.*

---

## ⚡ 10-Second Example

```tsx
// app/layout.tsx
import { AdInjectProvider, ConsentProvider, AdSenseScript } from "adinject-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <AdSenseScript client="ca-pub-1234567890123456" />
      </head>
      <body>
        <ConsentProvider mode="google-consent-v2">
          <AdInjectProvider client="ca-pub-1234567890123456">
            {children}
          </AdInjectProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/recipes/page.tsx
import { AdInjectFeed } from "adinject-react";
import { RecipeCard } from "@/components/recipe-card";

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <AdInjectFeed
      items={recipes}
      interval={3}        // Injects an ad card every 3 recipes
      startOffset={1}     // First ad appears after 1st recipe
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
    />
  );
}
```

---

## 🎥 See it in Production

- 🌐 **[Live Production Showcase (lady.recipes)](https://lady.recipes/)** — Experience live in-feed ad insertion with zero layout shift.
- 📺 **[Watch Walkthrough Video](https://drive.google.com/file/d/1CbygWorsfYaYb5MeRdT9knq0sNzO0k3Q/view?usp=sharing)** — Step-by-step video demonstration of feed placement and responsive behavior.
