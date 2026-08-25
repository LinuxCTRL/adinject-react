import type { AdUnit, FeedItem, PlacementRule } from "../types";

export interface InjectFeedAdsOptions<T> {
  items: T[];
  rule?: PlacementRule;
  adUnit?: AdUnit;
  adUnits?: Record<string, AdUnit>;
}

/**
 * Injects Google AdSense / affiliate ad placeholders between items in an array
 * (e.g. recipe grid, product catalog, blog list, infinite scroll feeds).
 *
 * @param options.items The original list of items (e.g. recipes, posts, products)
 * @param options.rule The placement rule configuring interval, offset, and max ads
 * @param options.adUnit The ad unit to render in the feed slot
 * @returns An interleaved array of FeedItem<T> containing items and ad slots
 */
export function injectFeedAds<T>({
  items,
  rule,
  adUnit,
  adUnits,
}: InjectFeedAdsOptions<T>): FeedItem<T>[] {
  if (!items || items.length === 0) return [];

  // Default ad unit if not provided
  const fallbackUnit: AdUnit = adUnit ||
    (rule && adUnits && adUnits[rule.adUnitId]) || {
      id: "default-feed-unit",
      name: "Default In-Feed Ad",
      client: "ca-pub-XXXXXXXX",
      slot: "0000000000",
      format: "fluid",
      responsive: true,
      testMode: true,
    };

  // If rule is explicitly disabled, return items without ads
  if (rule && !rule.enabled) {
    return items.map((data, index) => ({
      type: "item",
      data,
      index,
    }));
  }

  const interval = Math.max(1, rule?.itemInterval ?? 4);
  const startOffset = Math.max(0, rule?.startOffset ?? 2);
  const maxAds = Math.max(1, rule?.maxAdsPerFeed ?? 4);
  const gridSpan = rule?.gridSpan ?? "card";

  const result: FeedItem<T>[] = [];
  let adsInserted = 0;

  for (let i = 0; i < items.length; i++) {
    const currentItem = items[i];
    if (currentItem !== undefined) {
      result.push({
        type: "item",
        data: currentItem,
        index: i,
      });
    }

    const itemsCountSoFar = i + 1;
    const isAtStartOffset = itemsCountSoFar === startOffset;
    const isAtInterval =
      itemsCountSoFar > startOffset &&
      (itemsCountSoFar - startOffset) % interval === 0;

    if (
      (isAtStartOffset || isAtInterval) &&
      adsInserted < maxAds &&
      i < items.length - 1
    ) {
      result.push({
        type: "ad",
        adUnit: fallbackUnit,
        slotIndex: adsInserted,
        ruleId: rule?.id,
        gridSpan,
      });
      adsInserted++;
    }
  }

  return result;
}

/**
 * Type guard to check if a feed item is an ad slot
 */
export function isAdSlot<T>(
  item: FeedItem<T>,
): item is {
  type: "ad";
  adUnit: AdUnit;
  slotIndex: number;
  ruleId?: string;
  gridSpan?: "card" | "full_width";
} {
  return item.type === "ad";
}
