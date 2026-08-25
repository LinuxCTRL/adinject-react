import type { AdUnit, FeedItem, PlacementRule } from "../types";

export interface InjectFeedAdsOptions<T> {
	items: T[];
	rule?: PlacementRule;
	adUnit?: AdUnit;
	adUnits?: Record<string, AdUnit>;
	/** Stable idempotency key to prevent recalculating / doubling across re-renders */
	idempotencyKey?: string;
}

// Module-level idempotency cache for string keys
const keyCache = new Map<string, FeedItem<unknown>[]>();

/**
 * Injects Google AdSense / affiliate ad placeholders between items in an array
 * (e.g. recipe grid, product catalog, blog list, infinite scroll feeds).
 *
 * Fully idempotent: safe to call on every render, across SPA route transitions,
 * and within React StrictMode without duplicating ad slots.
 *
 * @param options.items The original list of items (e.g. recipes, posts, products)
 * @param options.rule The placement rule configuring interval, offset, and max ads
 * @param options.adUnit The ad unit to render in the feed slot
 * @param options.idempotencyKey Optional stable key for memoization
 * @returns An interleaved array of FeedItem<T> containing items and ad slots
 */
export function injectFeedAds<T>({
	items,
	rule,
	adUnit,
	adUnits,
	idempotencyKey,
}: InjectFeedAdsOptions<T>): FeedItem<T>[] {
	if (!items || items.length === 0) return [];

	if (idempotencyKey && keyCache.has(idempotencyKey)) {
		return keyCache.get(idempotencyKey) as FeedItem<T>[];
	}

	// Default ad unit if not provided
	const fallbackUnit: AdUnit = adUnit ||
		(rule && adUnits?.[rule.adUnitId]) || {
			id: "default-feed-unit",
			name: "Default In-Feed Ad",
			client: "ca-pub-XXXXXXXX",
			slot: "0000000000",
			format: "fluid",
			responsive: true,
			testMode: true,
		};

	// Idempotency guard: If items array was already injected with ads, strip previous ad slots
	const cleanItems: T[] = [];
	for (const item of items) {
		if (item && typeof item === "object" && "type" in item) {
			const candidate = item as { type: string; data?: T };
			if (candidate.type === "ad") {
				continue; // skip already injected ad slot
			}
			if (
				candidate.type === "item" &&
				"data" in candidate &&
				candidate.data !== undefined
			) {
				cleanItems.push(candidate.data);
				continue;
			}
		}
		cleanItems.push(item as T);
	}

	if (cleanItems.length === 0) return [];

	// If rule is explicitly disabled, return items without ads
	if (rule && !rule.enabled) {
		const rawItems: FeedItem<T>[] = cleanItems.map((data) => ({
			type: "item",
			data,
		}));
		if (idempotencyKey)
			keyCache.set(idempotencyKey, rawItems as FeedItem<unknown>[]);
		return rawItems;
	}

	const interval = Math.max(1, rule?.itemInterval ?? 4);
	const startOffset = Math.max(0, rule?.startOffset ?? 2);
	const maxAds = Math.max(1, rule?.maxAdsPerFeed ?? 4);
	const gridSpan = rule?.gridSpan ?? "card";

	const result: FeedItem<T>[] = [];
	let adsInserted = 0;

	for (let i = 0; i < cleanItems.length; i++) {
		const currentItem = cleanItems[i];
		if (currentItem !== undefined) {
			result.push({
				type: "item",
				data: currentItem,
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
				gridSpan,
			});
			adsInserted++;
		}
	}

	if (idempotencyKey) {
		keyCache.set(idempotencyKey, result as FeedItem<unknown>[]);
	}

	return result;
}

/**
 * Type guard to check if a feed item is an ad slot
 */
export function isAdSlot<T>(item: FeedItem<T>): item is {
	type: "ad";
	adUnit: AdUnit;
	slotIndex: number;
	gridSpan: "card" | "full_width";
} {
	return item.type === "ad";
}
