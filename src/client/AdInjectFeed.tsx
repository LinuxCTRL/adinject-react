"use client";

import React from "react";
import type { AdAdapter } from "../adapters";
import { loadScriptOnce } from "../adapters";
import { injectFeedAds, isAdSlot } from "../transformers/feed-inserter";
import type { AdUnit, PlacementRule } from "../types";
import { InFeedAdCard } from "./InFeedAdCard";

export interface AdInjectFeedProps<T> {
	items: T[];
	adapter?: AdAdapter;
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
	adapter,
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
	React.useEffect(() => {
		if (adapter?.loadScript) {
			loadScriptOnce(adapter.name, adapter.loadScript);
		}
	}, [adapter]);

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
			{feedItems.map((item, index) => {
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
							adapter={adapter}
							slotIndex={item.slotIndex}
							gridSpan={item.gridSpan}
							testMode={testMode}
						/>
					);
				}

				const itemIndex = item.index ?? index;
				return (
					<React.Fragment key={`adinject-item-${itemIndex}`}>
						{renderItem(item.data, itemIndex)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
