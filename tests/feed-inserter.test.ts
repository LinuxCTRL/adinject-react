import { describe, expect, it } from "bun:test";
import {
  injectFeedAds,
  isAdSlot,
} from "../src/transformers/feed-inserter";
import type { AdUnit, PlacementRule } from "../src/types";

describe("injectFeedAds", () => {
  const sampleItems = [
    { id: 1, title: "Recipe 1" },
    { id: 2, title: "Recipe 2" },
    { id: 3, title: "Recipe 3" },
    { id: 4, title: "Recipe 4" },
    { id: 5, title: "Recipe 5" },
    { id: 6, title: "Recipe 6" },
    { id: 7, title: "Recipe 7" },
    { id: 8, title: "Recipe 8" },
  ];

  const customAdUnit: AdUnit = {
    id: "test-ad-unit",
    name: "Test Ad Unit",
    client: "ca-pub-1234567890",
    slot: "9876543210",
    format: "rectangle",
  };

  const sampleRule: PlacementRule = {
    id: "rule-feed-1",
    name: "Feed Ad Rule",
    enabled: true,
    deviceFilter: "all",
    paragraphInterval: 3,
    minWordsBeforeFirstAd: 50,
    minParagraphsTotal: 3,
    maxAdsPerArticle: 3,
    itemInterval: 3,
    startOffset: 1,
    maxAdsPerFeed: 2,
    gridSpan: "card",
    adUnitId: "test-ad-unit",
  };

  it("should return an empty array if input items are empty", () => {
    const result = injectFeedAds({ items: [] });
    expect(result).toEqual([]);
  });

  it("should return items untouched if rule is disabled", () => {
    const disabledRule: PlacementRule = { ...sampleRule, enabled: false };
    const result = injectFeedAds({ items: sampleItems, rule: disabledRule });
    expect(result.length).toBe(sampleItems.length);
    expect(result.every((item) => item.type === "item")).toBe(true);
  });

  it("should interleave ad slots according to startOffset and itemInterval", () => {
    const result = injectFeedAds({
      items: sampleItems,
      rule: sampleRule,
      adUnit: customAdUnit,
    });

    // Start offset = 1 -> First ad after item index 0 (1st item)
    // Next ad after 3 items (1 + 3 = 4th item)
    // Max ads = 2
    const adSlots = result.filter(isAdSlot);
    expect(adSlots.length).toBe(2);

    expect(adSlots[0]?.slotIndex).toBe(0);
    expect(adSlots[0]?.adUnit.client).toBe("ca-pub-1234567890");
    expect(adSlots[1]?.slotIndex).toBe(1);
  });

  it("should respect maxAdsPerFeed cap", () => {
    const ruleWithCap: PlacementRule = {
      ...sampleRule,
      itemInterval: 1,
      startOffset: 1,
      maxAdsPerFeed: 1,
    };

    const result = injectFeedAds({
      items: sampleItems,
      rule: ruleWithCap,
      adUnit: customAdUnit,
    });

    const adSlots = result.filter(isAdSlot);
    expect(adSlots.length).toBe(1);
  });

  it("should correctly identify ad items with isAdSlot type guard", () => {
    const result = injectFeedAds({
      items: sampleItems,
      rule: sampleRule,
      adUnit: customAdUnit,
    });

    for (const entry of result) {
      if (isAdSlot(entry)) {
        expect(entry.type).toBe("ad");
        expect(entry.adUnit).toBeDefined();
        expect(typeof entry.slotIndex).toBe("number");
      } else {
        expect(entry.type).toBe("item");
        expect(entry.data).toBeDefined();
      }
    }
  });
});
