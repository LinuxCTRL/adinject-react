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
  options: AdInjectionOptions,
): PlacementRule | undefined {
  const { rules, pathname = "/", isMobile = false } = options;

  return rules.find((rule) => {
    if (!rule.enabled) return false;
    if (!matchesPathPattern(pathname, rule.targetPattern)) return false;
    if (!matchesDevice(rule.deviceFilter, isMobile)) return false;
    return true;
  });
}
