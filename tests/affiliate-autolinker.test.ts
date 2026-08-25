import { describe, expect, it } from "bun:test";
import {
  injectAffiliateKeywords,
  injectHtmlAffiliateKeywords,
  injectMarkdownAffiliateKeywords,
} from "../src/transformers/affiliate-autolinker";

describe("Affiliate Autolinker", () => {
  describe("injectHtmlAffiliateKeywords", () => {
    it("should replace target keywords with sponsored affiliate links in HTML", () => {
      const inputHtml = `
        <article>
          <p>For this recipe, we recommend using an air fryer or a dutch oven.</p>
        </article>
      `;

      const result = injectHtmlAffiliateKeywords(inputHtml, {
        rules: [
          {
            keyword: "air fryer",
            targetUrl: "https://amazon.com/air-fryer?tag=test-20",
          },
          {
            keyword: "dutch oven",
            targetUrl: "https://amazon.com/dutch-oven?tag=test-20",
          },
        ],
        maxLinksTotal: 2,
      });

      expect(result).toContain(
        '<a href="https://amazon.com/air-fryer?tag=test-20" target="_blank" rel="noopener noreferrer sponsored" class="adinject-affiliate-link" data-adinject-affiliate="1">air fryer</a>',
      );
      expect(result).toContain(
        '<a href="https://amazon.com/dutch-oven?tag=test-20" target="_blank" rel="noopener noreferrer sponsored" class="adinject-affiliate-link" data-adinject-affiliate="1">dutch oven</a>',
      );
    });

    it("should never replace keywords inside existing <a> tags", () => {
      const inputHtml = `
        <p>Check out our <a href="/fryer-guide">air fryer guide</a> before buying an air fryer.</p>
      `;

      const result = injectHtmlAffiliateKeywords(inputHtml, {
        rules: [
          {
            keyword: "air fryer",
            targetUrl: "https://amazon.com/air-fryer",
          },
        ],
      });

      // Existing <a> tag should remain clean and unmodified
      expect(result).toContain('<a href="/fryer-guide">air fryer guide</a>');
      // Second occurrence outside <a> should be linked
      expect(result).toContain(
        'before buying an <a href="https://amazon.com/air-fryer"',
      );
    });

    it("should skip headings and code blocks", () => {
      const inputHtml = `
        <h2>Best Air Fryer Models</h2>
        <code>const tool = "air fryer";</code>
        <p>Buy an air fryer today.</p>
      `;

      const result = injectHtmlAffiliateKeywords(inputHtml, {
        rules: [
          {
            keyword: "air fryer",
            targetUrl: "https://amazon.com/air-fryer",
          },
        ],
      });

      expect(result).toContain("<h2>Best Air Fryer Models</h2>");
      expect(result).toContain('<code>const tool = "air fryer";</code>');
      expect(result).toContain('<a href="https://amazon.com/air-fryer"');
    });

    it("should respect maxReplacements per keyword and maxLinksTotal", () => {
      const inputHtml = `
        <p>Air fryer one, air fryer two, air fryer three.</p>
      `;

      const result = injectHtmlAffiliateKeywords(inputHtml, {
        rules: [
          {
            keyword: "air fryer",
            targetUrl: "https://amazon.com/air-fryer",
            maxReplacements: 1,
          },
        ],
        maxLinksTotal: 1,
      });

      const matches = result.match(/href="https:\/\/amazon\.com\/air-fryer"/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe("injectMarkdownAffiliateKeywords", () => {
    it("should autolink markdown text while ignoring markdown links and code blocks", () => {
      const inputMd = `
# Best Dutch Oven Review

Using a dutch oven creates deep flavor.

\`\`\`ts
const oven = "dutch oven";
\`\`\`

[Already linked dutch oven](https://other.com)
      `;

      const result = injectMarkdownAffiliateKeywords(inputMd, {
        rules: [
          {
            keyword: "dutch oven",
            targetUrl: "https://amazon.com/dutch-oven",
          },
        ],
      });

      expect(result).toContain(
        '<a href="https://amazon.com/dutch-oven" target="_blank" rel="noopener noreferrer sponsored" class="adinject-affiliate-link" data-adinject-affiliate="1">dutch oven</a>',
      );
      expect(result).toContain('# Best Dutch Oven Review');
      expect(result).toContain('const oven = "dutch oven";');
      expect(result).toContain('[Already linked dutch oven](https://other.com)');
    });
  });

  describe("injectAffiliateKeywords universal helper", () => {
    it("should auto-detect HTML vs Markdown content", () => {
      const html = "<p>Use an air fryer.</p>";
      const md = "Use an air fryer.";

      const resHtml = injectAffiliateKeywords(html, {
        rules: [{ keyword: "air fryer", targetUrl: "https://amazon.com" }],
      });
      const resMd = injectAffiliateKeywords(md, {
        rules: [{ keyword: "air fryer", targetUrl: "https://amazon.com" }],
      });

      expect(resHtml).toContain('<p>Use an <a href="https://amazon.com"');
      expect(resMd).toContain('Use an <a href="https://amazon.com"');
    });
  });
});
