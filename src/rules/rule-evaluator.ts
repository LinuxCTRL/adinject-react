import type {
	AdDeviceFilter,
	AdInjectionOptions,
	PlacementRule,
} from "../types";

/**
 * Checks if a URL pathname matches a pattern (supports globs like /recipes/* or /recipes?*)
 */
export function matchesPathPattern(
	pathname: string,
	pattern?: string,
): boolean {
	if (!pattern || pattern === "*") return true;

	if (pattern.endsWith("/*")) {
		const prefix = pattern.slice(0, -2);
		return pathname.startsWith(prefix);
	}

	if (pattern.endsWith("*")) {
		const prefix = pattern.slice(0, -1);
		return pathname.startsWith(prefix);
	}

	return pathname === pattern;
}

/**
 * Returns true when a paragraph (1-based) should receive an ad slot.
 *
 * `startOffset` is the paragraph number after which the first ad is placed
 * (default: 1), and `interval` is the number of paragraphs between ads.
 *
 * Example: startOffset=1, interval=3 -> ads after paragraphs 1, 4, 7, ...
 */
export function isParagraphAdPosition(
	paragraphNumber: number,
	startOffset = 1,
	interval = 1,
): boolean {
	const offset = Math.max(1, Math.floor(startOffset || 1));
	const step = Math.max(1, Math.floor(interval || 1));
	if (paragraphNumber < offset) return false;
	return (paragraphNumber - offset) % step === 0;
}

/**
 * Evaluates device filters
 */
export function matchesDevice(
	ruleDevice: AdDeviceFilter,
	isMobile = false,
): boolean {
	if (ruleDevice === "all") return true;
	if (ruleDevice === "mobile" && isMobile) return true;
	if (ruleDevice === "desktop" && !isMobile) return true;
	return false;
}

/**
 * Finds the highest priority matching placement rule for a given route and device
 */
export function findMatchingRule(
	rules: PlacementRule[] | AdInjectionOptions,
	routeOptions?: { pathname?: string; isMobile?: boolean },
): PlacementRule | undefined {
	if (Array.isArray(rules)) {
		const pathname = routeOptions?.pathname ?? "/";
		const isMobile = routeOptions?.isMobile ?? false;
		return rules.find((rule) => {
			if (!rule.enabled) return false;
			if (!matchesPathPattern(pathname, rule.targetPattern)) return false;
			if (!matchesDevice(rule.deviceFilter, isMobile)) return false;
			return true;
		});
	}

	const { rules: optionsRules, pathname = "/", isMobile = false } = rules;

	return optionsRules.find((rule) => {
		if (!rule.enabled) return false;
		if (!matchesPathPattern(pathname, rule.targetPattern)) return false;
		if (!matchesDevice(rule.deviceFilter, isMobile)) return false;
		return true;
	});
}

// Aliases
export const matchPathname = matchesPathPattern;
export const isDeviceAllowed = matchesDevice;
export const evaluateRulesForRoute = findMatchingRule;
