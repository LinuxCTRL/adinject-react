import { describe, expect, it } from "bun:test";
import {
  injectAffiliateKeywords,
  injectFeedAds,
  injectHtmlAffiliateKeywords,
  injectMarkdownAffiliateKeywords,
  injectPortableTextAds,
} from "../src/transformers";
import type { AdUnit, PlacementRule, PortableTextBlock } from "../src/types";

describe("Idempotency & Density Guards", () => {
  const sampleAdUnit: AdUnit = {
    id: "unit-test",
    name: "Feed Unit",
    client: "ca-pub-1111",
    slot: "2222",
  };

  const sampleRule: PlacementRule = {
    id: "rule-feed",
    name: "Feed Spacing",
    enabled: true,
    deviceFilter: "all",
    paragraphInterval: 2,
    minWordsBeforeFirstAd: 10,
    minParagraphsTotal: 2,
    maxAdsPerArticle: 3,
    itemInterval: 2,
    startOffset: 2,
    maxAdsPerFeed: 2,
    gridSpan: "card",
    adUnitId: "unit-test",
  };

  it("should be idempotent when injectFeedAds is called repeatedly", () => {
    const rawItems = ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"];

    // First injection
    const firstPass = injectFeedAds({
      items: rawItems,
      rule: sampleRule,
      adUnit: sampleAdUnit,
    });

    const firstAdCount = firstPass.filter((i) => i.type === "ad").length;
    expect(firstAdCount).toBe(2);

    // Second injection (passing already transformed feedItems)
    const secondPass = injectFeedAds({
      items: firstPass as any,
      rule: sampleRule,
      adUnit: sampleAdUnit,
    });

    const secondAdCount = secondPass.filter((i) => i.type === "ad").length;
    expect(secondAdCount).toBe(firstAdCount); // Ads are not duplicated!
  });

  it("should be idempotent when injectPortableTextAds is called repeatedly", () => {
    const blocks: PortableTextBlock[] = [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [{ _type: "span", text: "Paragraph 1 with rich content for test." }],
      },
      {
        _type: "block",
        _key: "b2",
        style: "normal",
        children: [{ _type: "span", text: "Paragraph 2 with helpful recipe tips." }],
      },
      {
        _type: "block",
        _key: "b3",
        style: "normal",
        children: [{ _type: "span", text: "Paragraph 3 with step by step instructions." }],
      },
    ];

    const firstResult = injectPortableTextAds({
      blocks,
      rule: sampleRule,
      adUnit: sampleAdUnit,
    });

    expect(firstResult.insertedAds.length).toBe(1);

    // Second pass on the already transformed AST
    const secondResult = injectPortableTextAds({
      blocks: firstResult.content as any,
      rule: sampleRule,
      adUnit: sampleAdUnit,
    });

    expect(secondResult.insertedAds.length).toBe(1);
  });

  it("should respect maxLinksPerThousandWords density guard in HTML autolinker", () => {
    // 50-word paragraph
    const shortHtml = "<p>Use your air fryer and dutch oven to cook crispy chicken with an air fryer.</p>";
    
    // Setting max 1 link per 1,000 words means in short content (< 1000 words) it enforces maximum 1 link
    const result = injectHtmlAffiliateKeywords(shortHtml, {
      rules: [
        { keyword: "air fryer", targetUrl: "https://amazon.com/air-fryer" },
        { keyword: "dutch oven", targetUrl: "https://amazon.com/dutch-oven" },
      ],
      maxLinksTotal: 10,
      maxLinksPerThousandWords: 1, // Density cap restricts to 1
    });

    const linkMatches = result.match(/href="https:\/\/amazon\.com/g) || [];
    expect(linkMatches.length).toBe(1); // Density cap enforced!
  });

  it("should respect maxLinksPerThousandWords in Markdown autolinker", () => {
    const shortMd = "Use your air fryer and dutch oven for baking with an air fryer.";

    const result = injectMarkdownAffiliateKeywords(shortMd, {
      rules: [
        { keyword: "air fryer", targetUrl: "https://amazon.com/air-fryer" },
        { keyword: "dutch oven", targetUrl: "https://amazon.com/dutch-oven" },
      ],
      maxLinksTotal: 5,
      maxLinksPerThousandWords: 1,
    });

    const matches = result.match(/(?:href="https:\/\/amazon\.com|\[[^\]]+\]\(https:\/\/amazon\.com)/g) || [];
    expect(matches.length).toBe(1);
  });

  it("should return cached reference when idempotencyKey is provided", () => {
    const rawItems = ["Recipe 1", "Recipe 2", "Recipe 3", "Recipe 4", "Recipe 5"];
    const run1 = injectFeedAds({
      items: rawItems,
      rule: sampleRule,
      adUnit: sampleAdUnit,
      idempotencyKey: "recipe-grid-page-1",
    });

    const run2 = injectFeedAds({
      items: rawItems,
      rule: sampleRule,
      adUnit: sampleAdUnit,
      idempotencyKey: "recipe-grid-page-1",
    });

    expect(run1).toBe(run2); // exact cached reference
  });

  it("should stamp data-adinject-affiliate attribute on autolinked anchors", () => {
    const html = "<p>Get your air fryer ready for dinner.</p>";
    const result = injectHtmlAffiliateKeywords(html, {
      rules: [{ keyword: "air fryer", targetUrl: "https://amazon.com/air-fryer" }],
    });
    expect(result).toContain('data-adinject-affiliate="1"');
  });
});
