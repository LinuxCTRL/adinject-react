import type {
	AffiliateABTest,
	AffiliateClickEvent,
	AffiliateParamOptions,
	AffiliateProduct,
} from "../types";

/**
 * Appends affiliate tracking tags, UTM parameters, and sub-IDs to any URL cleanly.
 * Preserves existing search params and hash fragments.
 */
export function withAffiliateParams({
	url,
	params = {},
	amazonTag,
	subId,
	utmSource,
	utmMedium,
	utmCampaign,
	utmContent,
}: AffiliateParamOptions): string {
	if (!url) return "";

	try {
		const isRelative =
			!url.startsWith("http://") && !url.startsWith("https://");
		const dummyBase = "https://adinject-placeholder.local";
		const parsed = new URL(url, isRelative ? dummyBase : undefined);

		if (amazonTag) {
			parsed.searchParams.set("tag", amazonTag);
		}

		if (subId) {
			parsed.searchParams.set("subId", subId);
			parsed.searchParams.set("subid", subId);
		}

		if (utmSource) parsed.searchParams.set("utm_source", utmSource);
		if (utmMedium) parsed.searchParams.set("utm_medium", utmMedium);
		if (utmCampaign) parsed.searchParams.set("utm_campaign", utmCampaign);
		if (utmContent) parsed.searchParams.set("utm_content", utmContent);

		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				parsed.searchParams.set(key, String(value));
			}
		}

		if (isRelative) {
			return `${parsed.pathname}${parsed.search}${parsed.hash}`;
		}

		return parsed.toString();
	} catch {
		return url;
	}
}

/**
 * Tracks an outbound affiliate click event.
 * Dispatches a DOM CustomEvent and runs the optional callback.
 */
export function trackAffiliateClick(
	event: AffiliateClickEvent,
	customHandler?: (event: AffiliateClickEvent) => void,
): void {
	if (customHandler) {
		try {
			customHandler(event);
		} catch (err) {
			console.warn("[AdInject] custom click handler error:", err);
		}
	}

	if (typeof window !== "undefined") {
		try {
			const customEvent = new CustomEvent("adinject:affiliate_click", {
				detail: event,
				bubbles: true,
			});
			window.dispatchEvent(customEvent);
		} catch {
			// Ignore in non-browser/restricted environments
		}
	}
}

/**
 * Selects an affiliate product from an A/B test variant list based on weights or optional seed.
 */
export function pickABVariant(test: AffiliateABTest): AffiliateProduct {
	if (!test.variants || test.variants.length === 0) {
		throw new Error(`[AdInject] AB Test "${test.id}" has no variants.`);
	}

	if (test.variants.length === 1 && test.variants[0]?.product) {
		return test.variants[0].product;
	}

	const totalWeight = test.variants.reduce(
		(acc, v) => acc + Math.max(1, v.weight ?? 1),
		0,
	);

	let randomVal: number;
	if (test.seed) {
		let hash = 0;
		for (let i = 0; i < test.seed.length; i++) {
			hash = (hash << 5) - hash + test.seed.charCodeAt(i);
			hash |= 0;
		}
		randomVal = ((Math.abs(hash) % 1000) / 1000) * totalWeight;
	} else {
		randomVal = Math.random() * totalWeight;
	}

	let runningWeight = 0;
	for (const variant of test.variants) {
		runningWeight += Math.max(1, variant.weight ?? 1);
		if (randomVal <= runningWeight) {
			return variant.product;
		}
	}

	const fallbackVariant = test.variants[0];
	if (!fallbackVariant) {
		throw new Error(`[AdInject] AB Test "${test.id}" has no variants.`);
	}
	return fallbackVariant.product;
}
