import type { AdUnit, FeedItem, PlacementRule } from "../types";

export interface InjectFeedAdsOptions<T> {
	items: T[];
	rule?: PlacementRule;
	adUnit?: AdUnit;
	adUnits?: Record<string, AdUnit>;
	/** Stable idempotency key to prevent recalculating / doubling across re-renders */
	idempotencyKey?: string;
}

interface CacheEntry<T> {
	itemsRef: T[];
	itemsLength: number;
	ruleEnabled: boolean;
	ruleId?: string;
	interval?: number;
	startOffset?: number;
	maxAds?: number;
	adUnitId?: string;
	result: FeedItem<T>[];
}

const MAX_CACHE_ENTRIES = 200;
const keyCache = new Map<string, CacheEntry<unknown>>();

/**
 * Resets the module-level feed cache (mainly for testing)
 */
export function clearFeedCache(): void {
	keyCache.clear();
}

function getCachedResult<T>(
	key: string,
	items: T[],
	rule?: PlacementRule,
	adUnit?: AdUnit,
): FeedItem<T>[] | null {
	const entry = keyCache.get(key) as CacheEntry<T> | undefined;
	if (!entry) return null;

	// Invalidate if items reference changed and contents/length changed
	if (entry.itemsRef !== items && entry.itemsLength !== items.length) {
		return null;
	}

	// Invalidate if rule enabled state changed
	const ruleEnabled = rule ? rule.enabled : true;
	if (entry.ruleEnabled !== ruleEnabled) {
		return null;
	}

	// Invalidate if spacing parameters changed
	if (
		entry.interval !== (rule?.itemInterval ?? 4) ||
		entry.startOffset !== (rule?.startOffset ?? 2) ||
		entry.maxAds !== (rule?.maxAdsPerFeed ?? 4) ||
		entry.adUnitId !== (adUnit?.id ?? rule?.adUnitId)
	) {
		return null;
	}

	// Refresh position in Map for LRU
	keyCache.delete(key);
	keyCache.set(key, entry as CacheEntry<unknown>);

	return entry.result;
}

function setCachedResult<T>(
	key: string,
	items: T[],
	rule: PlacementRule | undefined,
	adUnit: AdUnit | undefined,
	result: FeedItem<T>[],
) {
	if (keyCache.size >= MAX_CACHE_ENTRIES) {
		const oldestKey = keyCache.keys().next().value;
		if (oldestKey !== undefined) {
			keyCache.delete(oldestKey);
		}
	}

	keyCache.set(key, {
		itemsRef: items,
		itemsLength: items.length,
		ruleEnabled: rule ? rule.enabled : true,
		ruleId: rule?.id,
		interval: rule?.itemInterval ?? 4,
		startOffset: rule?.startOffset ?? 2,
		maxAds: rule?.maxAdsPerFeed ?? 4,
		adUnitId: adUnit?.id ?? rule?.adUnitId,
		result,
	});
}

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

	if (idempotencyKey) {
		const cached = getCachedResult<T>(idempotencyKey, items, rule, adUnit);
		if (cached) return cached;
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
		if (idempotencyKey) {
			setCachedResult(idempotencyKey, items, rule, adUnit, rawItems);
		}
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
		setCachedResult(idempotencyKey, items, rule, adUnit, result);
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
