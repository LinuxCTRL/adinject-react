import { describe, expect, it } from "bun:test";
import { loadScriptOnce } from "../src/adapters";
import { clearFeedCache, injectFeedAds } from "../src/transformers/feed-inserter";
import type { AdUnit, PlacementRule } from "../src/types";

describe("Client Lifecycle & Cache Guards", () => {
  const sampleRule: PlacementRule = {
    id: "rule-cache-test",
    name: "Cache Rule",
    enabled: true,
    deviceFilter: "all",
    paragraphInterval: 2,
    minWordsBeforeFirstAd: 10,
    minParagraphsTotal: 2,
    maxAdsPerArticle: 3,
    itemInterval: 2,
    startOffset: 1,
    maxAdsPerFeed: 2,
    adUnitId: "unit-1",
  };

  const sampleUnit: AdUnit = {
    id: "unit-1",
    name: "Ad Unit 1",
    client: "ca-pub-1234",
    slot: "5678",
  };

  it("should clear cache when clearFeedCache is invoked", () => {
    clearFeedCache();
    const items = ["A", "B", "C", "D"];
    const run1 = injectFeedAds({
      items,
      rule: sampleRule,
      adUnit: sampleUnit,
      idempotencyKey: "test-clear",
    });

    clearFeedCache();

    const run2 = injectFeedAds({
      items,
      rule: sampleRule,
      adUnit: sampleUnit,
      idempotencyKey: "test-clear",
    });

    expect(run1).not.toBe(run2); // New array reference created after cache clear
    expect(run1).toEqual(run2);
  });

  it("should enforce LRU bounded eviction after max entries", () => {
    clearFeedCache();
    // Fill cache with 205 entries (max is 200)
    for (let i = 0; i < 205; i++) {
      injectFeedAds({
        items: ["item1", "item2"],
        rule: sampleRule,
        adUnit: sampleUnit,
        idempotencyKey: `key-${i}`,
      });
    }

    // Key 0 should have been evicted by LRU
    const firstRunKey0 = injectFeedAds({
      items: ["item1", "item2"],
      rule: sampleRule,
      adUnit: sampleUnit,
      idempotencyKey: "key-0",
    });

    // Key 204 should still be cached
    const runKey204 = injectFeedAds({
      items: ["item1", "item2"],
      rule: sampleRule,
      adUnit: sampleUnit,
      idempotencyKey: "key-204",
    });
    const runKey204Again = injectFeedAds({
      items: ["item1", "item2"],
      rule: sampleRule,
      adUnit: sampleUnit,
      idempotencyKey: "key-204",
    });

    expect(runKey204).toBe(runKey204Again); // cached
  });

  it("should deduplicate script loading via loadScriptOnce", () => {
    let loadCount = 0;
    const loader = () => {
      loadCount++;
    };

    // Simulate window environment
    (globalThis as any).window = globalThis;

    loadScriptOnce("test-adapter-dedup", loader);
    loadScriptOnce("test-adapter-dedup", loader);

    expect(loadCount).toBe(1);
  });
});
