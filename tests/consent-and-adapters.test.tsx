import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  adsenseAdapter,
  createAdAdapter,
  ezoicAdapter,
  gamAdapter,
} from "../src/adapters";
import {
  AdFallback,
  AdInjectFeed,
  AdSenseSlot,
  ConsentProvider,
  InFeedAdCard,
  useConsent,
} from "../src/client";
import type { AdUnit, FallbackBanner } from "../src/types";

describe("Consent Provider & Ad Adapters", () => {
  const sampleAdUnit: AdUnit = {
    id: "unit-1",
    name: "Banner Ad",
    client: "ca-pub-1234567890",
    slot: "1122334455",
    format: "rectangle",
  };

  const sampleFallback: FallbackBanner = {
    id: "fb-1",
    name: "Affiliate Offer",
    type: "custom_cta",
    targetUrl: "https://lady.recipes/cookbook",
    title: "Mediterranean Recipe Guide",
    badgeText: "Sponsored",
    ctaText: "Get Recipe Book",
  };

  it("should provide consent state to children and render ad slot when granted", () => {
    const html = renderToString(
      <ConsentProvider initialStatus="granted">
        <AdSenseSlot client="ca-pub-1234" slot="5678" testMode={true} />
      </ConsentProvider>,
    );
    expect(html).toContain("Google AdSense Test Slot");
  });

  it("should render affiliate fallback when consent is denied", () => {
    const html = renderToString(
      <ConsentProvider initialStatus="denied">
        <AdSenseSlot
          client="ca-pub-1234"
          slot="5678"
          testMode={false}
          fallback={sampleFallback}
          consentFallback="affiliate"
        />
      </ConsentProvider>,
    );
    expect(html).toContain("Mediterranean Recipe Guide");
    expect(html).toContain("Get Recipe Book");
    expect(html).not.toContain("<ins");
  });

  it("should render placeholder when consent is pending and no affiliate fallback is set", () => {
    const html = renderToString(
      <ConsentProvider initialStatus="unknown">
        <AdSenseSlot client="ca-pub-1234" slot="5678" testMode={false} />
      </ConsentProvider>,
    );
    expect(html).toContain("Consent Required for Personalized Ads");
  });

  it("should render Google Ad Manager (GAM) adapter correctly", () => {
    const adapter = gamAdapter({ networkCode: "123456", testMode: true });
    const html = renderToString(
      adapter.render({ slot: "leaderboard", client: "123456" }),
    );
    expect(html).toContain("Google Ad Manager (GAM) Slot");
    expect(html).toContain("/123456/leaderboard");
    expect(html).toContain("<aside");
    expect(html).toContain('aria-label="Google Ad Manager Advertisement"');
  });

  it("should render Ezoic adapter test placeholder", () => {
    const adapter = ezoicAdapter({ siteId: "site_999", testMode: true });
    const html = renderToString(
      adapter.render({ slot: "101" }),
    );
    expect(html).toContain("Ezoic Ad Placeholder #");
    expect(html).toContain("101");
    expect(html).toContain("<aside");
  });

  it("should support AdInjectFeed with custom adapter", () => {
    const adapter = gamAdapter({ networkCode: "777888", testMode: true });
    const items = ["Recipe A", "Recipe B", "Recipe C", "Recipe D"];

    const html = renderToString(
      <AdInjectFeed
        items={items}
        interval={2}
        startOffset={2}
        adapter={adapter}
        renderItem={(item) => <div className="recipe-card">{item}</div>}
      />,
    );

    expect(html).toContain("Recipe A");
    expect(html).toContain("Recipe B");
    expect(html).toContain("Google Ad Manager (GAM) Slot");
  });

  it("should include ARIA accessibility labels across all ad slots", () => {
    const slotHtml = renderToString(
      <AdSenseSlot client="ca-pub-1234" slot="5678" testMode={true} />,
    );
    expect(slotHtml).toContain("<aside");
    expect(slotHtml).toContain('aria-label="Advertisement"');

    const feedCardHtml = renderToString(
      <InFeedAdCard adUnit={sampleAdUnit} testMode={true} />,
    );
    expect(feedCardHtml).toContain("<aside");
    expect(feedCardHtml).toContain('aria-label="Sponsored In-Feed Advertisement"');

    const fallbackHtml = renderToString(
      <AdFallback fallback={sampleFallback} />,
    );
    expect(fallbackHtml).toContain('aria-label="Advertisement: Mediterranean Recipe Guide"');
  });

  it("should support GPP mode in ConsentProvider", () => {
    const html = renderToString(
      <ConsentProvider mode="gpp" initialStatus="granted">
        <div data-testid="gpp-child">GPP Content</div>
      </ConsentProvider>,
    );
    expect(html).toContain("GPP Content");
  });

  it("should forward contentCategory to AdSense and GAM slots", () => {
    const slotHtml = renderToString(
      <AdSenseSlot
        client="ca-pub-1234"
        slot="5678"
        testMode={true}
        contentCategory="IAB8-5"
      />,
    );
    expect(slotHtml).toContain('data-adinject-category="IAB8-5"');

    const adapter = gamAdapter({ networkCode: "123456", testMode: true });
    const gamHtml = renderToString(
      adapter.render({ slot: "test-slot", contentCategory: "IAB8-5" }),
    );
    expect(gamHtml).toContain('data-adinject-category="IAB8-5"');
  });
});
