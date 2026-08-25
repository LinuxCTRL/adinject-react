"use client";

import React from "react";
import { injectFeedAds, isAdSlot } from "../transformers/feed-inserter";
import { InFeedAdCard } from "./InFeedAdCard";
import type { AdUnit, PlacementRule } from "../types";

export interface AdInjectFeedProps<T> {
  items: T[];
  rule?: Partial<PlacementRule>;
  adUnit?: AdUnit;
  interval?: number;
  startOffset?: number;
  maxAds?: number;
  gridSpan?: "card" | "full_width";
  testMode?: boolean;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderAd?: (
    adUnit: AdUnit,
    slotIndex: number,
    gridSpan?: "card" | "full_width",
  ) => React.ReactNode;
}

/**
 * AdInjectFeed
 * Drop-in declarative React component that automatically renders a list or grid
 * of items with zero-CLS ads interleaved at exact intervals.
 *
 * @example
 * ```tsx
 * import { AdInjectFeed } from "adinject-react";
 *
 * export default function RecipesGrid({ recipes }) {
 *   return (
 *     <AdInjectFeed
 *       items={recipes}
 *       interval={3}
 *       className="grid grid-cols-1 md:grid-cols-3 gap-6"
 *       renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} />}
 *     />
 *   );
 * }
 * ```
 */
export function AdInjectFeed<T>({
  items,
  rule,
  adUnit,
  interval = 3,
  startOffset = 1,
  maxAds = 4,
  gridSpan = "card",
  testMode = false,
  className = "",
  renderItem,
  renderAd,
}: AdInjectFeedProps<T>) {
  const feedItems = injectFeedAds({
    items,
    rule: {
      id: rule?.id || "inline-feed-rule",
      name: rule?.name || "Inline Feed Rule",
      enabled: rule?.enabled ?? true,
      deviceFilter: rule?.deviceFilter || "all",
      placementType: "feed_grid",
      paragraphInterval: 2,
      minWordsBeforeFirstAd: 30,
      minParagraphsTotal: 2,
      maxAdsPerArticle: 4,
      itemInterval: rule?.itemInterval ?? interval,
      startOffset: rule?.startOffset ?? startOffset,
      maxAdsPerFeed: rule?.maxAdsPerFeed ?? maxAds,
      gridSpan: rule?.gridSpan ?? gridSpan,
      adUnitId: rule?.adUnitId || adUnit?.id || "default",
    },
    adUnit,
  });

  return (
    <div className={className}>
      {feedItems.map((item, idx) => {
        if (isAdSlot(item)) {
          if (renderAd) {
            return (
              <React.Fragment key={`adinject-ad-${item.slotIndex}`}>
                {renderAd(item.adUnit, item.slotIndex, item.gridSpan)}
              </React.Fragment>
            );
          }
          return (
            <InFeedAdCard
              key={`adinject-ad-${item.slotIndex}`}
              adUnit={item.adUnit}
              slotIndex={item.slotIndex}
              gridSpan={item.gridSpan}
              testMode={testMode}
            />
          );
        }

        return (
          <React.Fragment key={`adinject-item-${item.index}`}>
            {renderItem(item.data, item.index)}
          </React.Fragment>
        );
      })}
    </div>
  );
}
