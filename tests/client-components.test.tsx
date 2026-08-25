import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  AdFallback,
  AdInjectProvider,
  AdSenseSlot,
  AffiliateABSlot,
  AffiliateCard,
  AffiliateDisclosure,
  AffiliateEquipmentBox,
  InArticleAds,
  InFeedAdCard,
} from "../src/client";
import type { AdUnit, AffiliateProduct, FallbackBanner } from "../src/types";

describe("Client Components SSR Rendering", () => {
  const sampleFallback: FallbackBanner = {
    id: "fb-1",
    name: "Affiliate Pan",
    type: "custom_cta",
    targetUrl: "https://amazon.com/pan?tag=test-20",
    title: "Non-Stick Pan",
    description: "Great non-stick skillet for everyday cooking.",
    badgeText: "Recommended",
    ctaText: "Check Deal",
  };

  const sampleAdUnit: AdUnit = {
    id: "ad-1",
    name: "Main Ad Slot",
    client: "ca-pub-1234567890",
    slot: "9876543210",
    format: "rectangle",
    fallback: sampleFallback,
  };

  const sampleProduct: AffiliateProduct = {
    id: "prod-1",
    title: "Ninja Air Fryer 4-Qt",
    description: "Compact air fryer with 4 cooking functions.",
    targetUrl: "https://amazon.com/ninja?tag=test-20",
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.8,
    reviewCount: 24000,
    merchant: "Amazon",
    badgeText: "Top Pick",
    ctaText: "Buy on Amazon",
  };

  it("should render AdSenseSlot with test mode UI", () => {
    const html = renderToString(
      <AdSenseSlot
        client="ca-pub-1234567890"
        slot="9876543210"
        format="rectangle"
        testMode={true}
      />,
    );

    expect(html).toContain("Google AdSense Test Slot");
    expect(html).toContain("9876543210");
  });

  it("should render AdFallback banner", () => {
    const html = renderToString(<AdFallback fallback={sampleFallback} />);
    expect(html).toContain("Non-Stick Pan");
    expect(html).toContain("Check Deal");
    expect(html).toContain('rel="noopener noreferrer sponsored"');
  });

  it("should render InFeedAdCard with sponsored label", () => {
    const html = renderToString(
      <InFeedAdCard adUnit={sampleAdUnit} slotIndex={0} testMode={true} />,
    );
    expect(html).toContain("Sponsored");
    expect(html).toContain("In-Feed #");
  });

  it("should render AffiliateCard in horizontal and card variants", () => {
    const htmlHorizontal = renderToString(
      <AffiliateCard product={sampleProduct} variant="horizontal" />,
    );
    expect(htmlHorizontal).toContain("Ninja Air Fryer 4-Qt");
    expect(htmlHorizontal).toContain("89.99");
    expect(htmlHorizontal).toContain("Top Pick");
    expect(htmlHorizontal).toContain('rel="noopener noreferrer sponsored"');

    const htmlCard = renderToString(
      <AffiliateCard product={sampleProduct} variant="card" />,
    );
    expect(htmlCard).toContain("Ninja Air Fryer 4-Qt");
  });

  it("should render AffiliateEquipmentBox with products", () => {
    const html = renderToString(
      <AffiliateEquipmentBox
        title="Equipment Used"
        products={[sampleProduct]}
        columns={2}
      />,
    );
    expect(html).toContain("Equipment Used");
    expect(html).toContain("Ninja Air Fryer 4-Qt");
  });

  it("should render AffiliateDisclosure presets and variants", () => {
    const amazonHtml = renderToString(
      <AffiliateDisclosure variant="banner" preset="amazon" />,
    );
    expect(amazonHtml).toContain("Amazon Associate");

    const compactHtml = renderToString(
      <AffiliateDisclosure variant="compact" preset="standard" />,
    );
    expect(compactHtml).toContain("affiliate links");
  });

  it("should render AffiliateABSlot with deterministic variant", () => {
    const html = renderToString(
      <AffiliateABSlot
        test={{
          id: "pan-test",
          variants: [{ id: "v1", product: sampleProduct }],
          seed: "recipe-slug",
        }}
      />,
    );
    expect(html).toContain("Ninja Air Fryer 4-Qt");
  });

  it("should render InArticleAds with paragraph insertion", () => {
    const articleHtml = `
      <p>Paragraph 1: Welcome to our Moroccan Tagine culinary masterclass with spices.</p>
      <p>Paragraph 2: Heat olive oil over medium flame and sauté onions until translucent.</p>
      <p>Paragraph 3: Add saffron, ginger, turmeric, and sea salt to the aromatic base.</p>
      <p>Paragraph 4: Simmer gently on low heat for 45 minutes until tender.</p>
    `;

    const html = renderToString(
      <InArticleAds
        html={articleHtml}
        interval={2}
        slot="998877"
        testMode={true}
      />,
    );

    expect(html).toContain("Moroccan Tagine");
    expect(html).toContain("Google AdSense Test Slot");
    expect(html).toContain("998877");
  });

  it("should inherit client and testMode from AdInjectProvider", () => {
    const html = renderToString(
      <AdInjectProvider client="ca-pub-INHERITED-999" testMode={true}>
        <AdSenseSlot slot="inherited-slot-1" />
      </AdInjectProvider>,
    );

    expect(html).toContain("Google AdSense Test Slot");
    expect(html).toContain("inherited-slot-1");
  });
});
