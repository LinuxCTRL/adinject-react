import { describe, expect, it } from "bun:test";
import {
  evaluateRulesForRoute,
  findMatchingRule,
  isDeviceAllowed,
  matchPathname,
} from "../src/rules/rule-evaluator";
import type { PlacementRule } from "../src/types";

describe("Rule Evaluator", () => {
  const rules: PlacementRule[] = [
    {
      id: "recipe-rule",
      name: "Recipe Pages Rule",
      enabled: true,
      targetPattern: "/recipes/*",
      deviceFilter: "all",
      paragraphInterval: 2,
      minWordsBeforeFirstAd: 50,
      minParagraphsTotal: 3,
      maxAdsPerArticle: 3,
      adUnitId: "ad-recipe",
    },
    {
      id: "mobile-only-rule",
      name: "Mobile Only Rule",
      enabled: true,
      targetPattern: "/blog/*",
      deviceFilter: "mobile",
      paragraphInterval: 2,
      minWordsBeforeFirstAd: 50,
      minParagraphsTotal: 3,
      maxAdsPerArticle: 2,
      adUnitId: "ad-mobile",
    },
  ];

  describe("matchPathname", () => {
    it("should match glob wildcards accurately", () => {
      expect(matchPathname("/recipes/chicken-tagine", "/recipes/*")).toBe(true);
      expect(matchPathname("/recipes", "/recipes/*")).toBe(true);
      expect(matchPathname("/about", "/recipes/*")).toBe(false);
    });
  });

  describe("isDeviceAllowed", () => {
    it("should correctly filter devices", () => {
      expect(isDeviceAllowed("all", true)).toBe(true);
      expect(isDeviceAllowed("all", false)).toBe(true);
      expect(isDeviceAllowed("mobile", true)).toBe(true);
      expect(isDeviceAllowed("mobile", false)).toBe(false);
      expect(isDeviceAllowed("desktop", false)).toBe(true);
      expect(isDeviceAllowed("desktop", true)).toBe(false);
    });
  });

  describe("findMatchingRule & evaluateRulesForRoute", () => {
    it("should find the matching active rule for a given pathname and device", () => {
      const match = findMatchingRule(rules, {
        pathname: "/recipes/best-cookies",
        isMobile: false,
      });
      expect(match?.id).toBe("recipe-rule");

      const mobileMatch = findMatchingRule(rules, {
        pathname: "/blog/cooking-tips",
        isMobile: true,
      });
      expect(mobileMatch?.id).toBe("mobile-only-rule");

      const desktopBlogMatch = findMatchingRule(rules, {
        pathname: "/blog/cooking-tips",
        isMobile: false,
      });
      expect(desktopBlogMatch).toBeUndefined();
    });
  });
});
