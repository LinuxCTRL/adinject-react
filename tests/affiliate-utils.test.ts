import { describe, expect, it } from "bun:test";
import type { AffiliateABTest, AffiliateClickEvent } from "../src/types";
import {
  pickABVariant,
  trackAffiliateClick,
  withAffiliateParams,
} from "../src/utils/affiliate-utils";

describe("Affiliate Utilities", () => {
  describe("withAffiliateParams", () => {
    it("should correctly attach amazonTag, subId, and UTM parameters", () => {
      const url = withAffiliateParams({
        url: "https://www.amazon.com/dp/B08N5WRWNW?ref=test",
        amazonTag: "ladyrecipes-20",
        subId: "moroccan-tagine-recipe",
        utmSource: "adinject",
        utmMedium: "affiliate",
        utmCampaign: "recipe_gear",
        utmContent: "equipment_box",
        params: { custom_param: "123" },
      });

      const parsed = new URL(url);
      expect(parsed.searchParams.get("tag")).toBe("ladyrecipes-20");
      expect(parsed.searchParams.get("subId")).toBe("moroccan-tagine-recipe");
      expect(parsed.searchParams.get("utm_source")).toBe("adinject");
      expect(parsed.searchParams.get("utm_medium")).toBe("affiliate");
      expect(parsed.searchParams.get("utm_campaign")).toBe("recipe_gear");
      expect(parsed.searchParams.get("utm_content")).toBe("equipment_box");
      expect(parsed.searchParams.get("custom_param")).toBe("123");
      expect(parsed.searchParams.get("ref")).toBe("test");
    });

    it("should handle empty or invalid URLs gracefully", () => {
      expect(withAffiliateParams({ url: "" })).toBe("");
    });
  });

  describe("pickABVariant", () => {
    const abTest: AffiliateABTest = {
      id: "pan-test",
      variants: [
        {
          id: "var-a",
          product: { id: "pan-a", title: "Pan A", targetUrl: "https://a.com" },
          weight: 70,
        },
        {
          id: "var-b",
          product: { id: "pan-b", title: "Pan B", targetUrl: "https://b.com" },
          weight: 30,
        },
      ],
      seed: "deterministic-recipe-slug-123",
    };

    it("should deterministically select the same variant for a given seed", () => {
      const pick1 = pickABVariant(abTest);
      const pick2 = pickABVariant(abTest);
      expect(pick1.id).toBe(pick2.id);
    });

    it("should throw an error if test has no variants", () => {
      expect(() => pickABVariant({ id: "empty", variants: [] })).toThrow();
    });
  });

  describe("trackAffiliateClick", () => {
    it("should invoke custom click handler callback with event data", () => {
      let recordedEvent: AffiliateClickEvent | null = null;
      const event: AffiliateClickEvent = {
        productId: "skillet-1",
        productTitle: "Cast Iron Skillet",
        targetUrl: "https://amazon.com/skillet",
        merchant: "Amazon",
        placement: "equipment-box",
        timestamp: Date.now(),
      };

      trackAffiliateClick(event, (e) => {
        recordedEvent = e;
      });

      expect(recordedEvent).not.toBeNull();
      expect(recordedEvent?.productId).toBe("skillet-1");
      expect(recordedEvent?.merchant).toBe("Amazon");
    });
  });
});
