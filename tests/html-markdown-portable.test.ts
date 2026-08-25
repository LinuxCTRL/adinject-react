import { describe, expect, it } from "bun:test";
import { injectHtmlAds } from "../src/transformers/html-inserter";
import { injectMarkdownAds } from "../src/transformers/markdown-inserter";
import {
  injectPortableTextAds,
  injectPortableTextAffiliate,
} from "../src/transformers/portable-text-adapter";
import type { AdUnit, PlacementRule } from "../src/types";

describe("Content Transformers", () => {
  const adUnit: AdUnit = {
    id: "in-article-unit",
    name: "In-Article Unit",
    client: "ca-pub-1234567890",
    slot: "1122334455",
    format: "fluid",
  };

  const rule: PlacementRule = {
    id: "rule-1",
    name: "In Article Rule",
    enabled: true,
    deviceFilter: "all",
    paragraphInterval: 2,
    minWordsBeforeFirstAd: 10,
    minParagraphsTotal: 3,
    maxAdsPerArticle: 2,
    adUnitId: "in-article-unit",
  };

  describe("injectHtmlAds", () => {
    it("should inject ad markers after every N paragraphs", () => {
      const html = `
        <p>Paragraph 1 with enough words to satisfy word count limits.</p>
        <p>Paragraph 2 with more rich content about cooking and food.</p>
        <p>Paragraph 3 continues the explanation of cooking techniques.</p>
        <p>Paragraph 4 concludes the recipe guide with storage instructions.</p>
      `;

      const result = injectHtmlAds({ html, rule, adUnit });
      expect(result.insertedAds.length).toBeGreaterThan(0);
      expect(result.content).toContain('data-ad-slot="1122334455"');
    });

    it("should not inject ads if content is too short", () => {
      const shortHtml = "<p>Short paragraph 1.</p>";
      const result = injectHtmlAds({ html: shortHtml, rule, adUnit });
      expect(result.insertedAds.length).toBe(0);
    });
  });

  describe("injectMarkdownAds", () => {
    it("should inject ad markers into Markdown paragraphs", () => {
      const markdown = `
Paragraph 1 with sufficient words to pass the minimum word threshold easily.

Paragraph 2 contains more helpful recipe details and tips.

Paragraph 3 explains oven temperature adjustments and baking times.

Paragraph 4 summarizes the recipe and nutritional info.
      `;

      const result = injectMarkdownAds({ markdown, rule, adUnit });
      expect(result.insertedAds.length).toBeGreaterThan(0);
    });
  });

  describe("injectPortableTextAds & injectPortableTextAffiliate", () => {
    it("should inject ad blocks into Sanity Portable Text AST", () => {
      const blocks = [
        {
          _type: "block",
          _key: "k1",
          style: "normal",
          children: [{ _type: "span", text: "Paragraph 1 with multiple words to hit word threshold." }],
        },
        {
          _type: "block",
          _key: "k2",
          style: "normal",
          children: [{ _type: "span", text: "Paragraph 2 with helpful cooking and preparation steps." }],
        },
        {
          _type: "block",
          _key: "k3",
          style: "normal",
          children: [{ _type: "span", text: "Paragraph 3 explaining seasonings and flavors." }],
        },
      ];

      const result = injectPortableTextAds({ blocks, rule, adUnit });
      expect(result.insertedAds.length).toBe(1);
      expect(result.content.some((b) => b._type === "adinject.adSlot")).toBe(true);
    });

    it("should inject affiliate card blocks into Sanity Portable Text", () => {
      const blocks = [
        {
          _type: "block",
          _key: "k1",
          style: "normal",
          children: [{ _type: "span", text: "Intro paragraph." }],
        },
        {
          _type: "block",
          _key: "k2",
          style: "normal",
          children: [{ _type: "span", text: "Second paragraph." }],
        },
      ];

      const result = injectPortableTextAffiliate({
        blocks,
        type: "adinject.affiliateCard",
        data: { id: "product-1", title: "Air Fryer" },
        afterParagraph: 1,
      });

      expect(
        result.some(
          (b) => b._type === "adinject.affiliateCard" && (b as any).data.title === "Air Fryer",
        ),
      ).toBe(true);
    });
  });
});
