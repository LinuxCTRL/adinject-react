# Companion Visual DevTools (`adinject-devtools`)

When developing locally or auditing monetization setups, configuring ad coordinates and slot IDs by hand can be tedious.

The companion package **[`adinject-devtools`](https://www.npmjs.com/package/adinject-devtools)** provides an interactive floating overlay directly on your running Next.js application.

---

## 1. Installation

Install `adinject-devtools` as a dev dependency:

```bash
# npm
npm install --save-dev adinject-devtools

# bun
bun add -d adinject-devtools

# pnpm
pnpm add -D adinject-devtools
```

---

## 2. Setup in Root Layout (`app/layout.tsx`)

Mount `<AdInjectDevTools />` inside `<AdInjectProvider />`. The component is completely inert and automatically tree-shaken from production builds:

```tsx
import { AdInjectProvider } from "adinject-react";
import { AdInjectDevTools } from "adinject-devtools";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdInjectProvider client="ca-pub-1234567890123456">
          {children}

          {/* Rendered only in local development */}
          {process.env.NODE_ENV !== "production" && <AdInjectDevTools />}
        </AdInjectProvider>
      </body>
    </html>
  );
}
```

---

## 3. Key DevTools Features

### 🎯 1. Point & Click Visual Inserter
Hover over any element on your live web page (card grid, article paragraph, sidebar, header). Click to place a mock ad unit and immediately inspect:
- Calculated aspect ratio and min-height bounding box.
- Generated copy-paste ready JSX snippet.

### ✨ 2. 1-Click "Auto-Pick Best Places" Engine
Runs a layout analysis across the current page DOM to identify optimal, high-CTR, zero-CLS insertion points that comply with Google Publisher & Better Ads Standards.

### 🤖 3. AI Coding Agent Prompt Generator
Generates structured Markdown instructions formatted specifically for:
- **Antigravity**
- **Cursor**
- **Claude Code**
- **GitHub Copilot**

You can copy the generated prompt and paste it into your AI assistant to implement the exact code changes needed.

### 🛡️ 4. Zero-CLS Policy Auditor
Audits your live ad slots in real time to catch:
- Unconstrained ad container `<div>` tags that cause layout shifts.
- Density violations (e.g. ad-to-content ratio $> 30\%$).
- Proximity violations (ads placed too close to clickable buttons).

### 🎨 5. Creative Mockup Studio
Simulate realistic high-resolution ad creatives across 6 industry verticals:
1. 🍳 Food & Cooking
2. 💻 Tech & Hardware
3. ☁️ SaaS & Developer Tools
4. 🛍️ E-Commerce & Fashion
5. ✈️ Travel & Hospitality
6. 📈 Finance & Investing
