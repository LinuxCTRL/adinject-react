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

    it("should respect minParagraphsTotal threshold", () => {
      const html = `
        <p>Paragraph 1 with plenty of words to easily exceed word limits.</p>
        <p>Paragraph 2 with plenty of words to easily exceed word limits.</p>
      `;
      const result = injectHtmlAds({
        html,
        rule: { ...rule, minParagraphsTotal: 4 },
        adUnit,
      });
      expect(result.insertedAds.length).toBe(0);
    });

    it("should place first ad after startOffset paragraph", () => {
      const html = `
        <p>Paragraph 1 with plenty of words to easily exceed word limits.</p>
        <p>Paragraph 2 with plenty of words to easily exceed word limits.</p>
        <p>Paragraph 3 with plenty of words to easily exceed word limits.</p>
        <p>Paragraph 4 with plenty of words to easily exceed word limits.</p>
      `;
      const result = injectHtmlAds({
        html,
        rule: { ...rule, startOffset: 2, paragraphInterval: 2, minParagraphsTotal: 2 },
        adUnit,
      });
      expect(result.insertedAds.length).toBe(2);
      expect(result.insertedAds[0]?.insertedAfterParagraph).toBe(2);
      expect(result.insertedAds[1]?.insertedAfterParagraph).toBe(4);
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

    it("should respect minParagraphsTotal and startOffset in Markdown", () => {
      const markdown = `
Paragraph 1 with plenty of words to easily exceed word limits.

Paragraph 2 with plenty of words to easily exceed word limits.
      `;
      const resultTooShort = injectMarkdownAds({
        markdown,
        rule: { ...rule, minParagraphsTotal: 4 },
        adUnit,
      });
      expect(resultTooShort.insertedAds.length).toBe(0);

      const markdownFour = `
Paragraph 1 with plenty of words.

Paragraph 2 with plenty of words.

Paragraph 3 with plenty of words.

Paragraph 4 with plenty of words.
      `;
      const resultOffset = injectMarkdownAds({
        markdown: markdownFour,
        rule: { ...rule, startOffset: 2, paragraphInterval: 2, minParagraphsTotal: 2 },
        adUnit,
      });
      expect(resultOffset.insertedAds.length).toBe(1); // after para 2 (para 4 is the last block, skipped by i < rawBlocks.length - 1)
      expect(resultOffset.insertedAds[0]?.insertedAfterParagraph).toBe(2);
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
