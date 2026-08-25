import type { AdUnit, FallbackBanner, PlacementRule } from "../types";

export interface AdInjectProjectConfig {
	projectId: string;
	name: string;
	domain: string;
	status: "active" | "setup_pending";
	rules: PlacementRule[];
	adUnits: Record<string, AdUnit>;
	fallbacks?: Record<string, FallbackBanner>;
	updatedAt?: string;
}

export interface FetchAdInjectConfigOptions {
	projectId: string;
	baseUrl?: string;
	revalidate?: number; // default: 300 seconds (5 minutes ISR)
	maxRetries?: number; // default: 2 retries (3 attempts total)
	timeoutMs?: number; // default: 5000ms
	fallbackConfig?: AdInjectProjectConfig;
}

// In-memory SWR cache for non-Next.js environments or client runtimes
const swrCache = new Map<
	string,
	{ config: AdInjectProjectConfig; fetchedAt: number }
>();

/**
 * Fetches compiled project rules, ad units, and fallback settings from the AdInject Edge API.
 * Features built-in:
 * - Exponential backoff retry for transient network glitches
 * - Stale-While-Revalidate cache with Next.js ISR tags
 * - Graceful static fallback config recovery
 *
 * @example
 * ```tsx
 * const config = await fetchAdInjectConfig({
 *   projectId: "proj_lady_recipes",
 *   fallbackConfig: STATIC_LOCAL_CONFIG,
 * });
 * ```
 */
export async function fetchAdInjectConfig({
	projectId,
	baseUrl = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADINJECT_API_URL
		? process.env.NEXT_PUBLIC_ADINJECT_API_URL
		: "https://adinject.io",
	revalidate = 300,
	maxRetries = 2,
	timeoutMs = 5000,
	fallbackConfig,
}: FetchAdInjectConfigOptions): Promise<AdInjectProjectConfig | null> {
	if (!projectId) return fallbackConfig || null;

	const cleanUrl = baseUrl.replace(/\/$/, "");
	const targetUrl = `${cleanUrl}/api/v1/config/${encodeURIComponent(projectId)}`;

	// Check SWR memory cache for fresh hit
	const cached = swrCache.get(projectId);
	const now = Date.now();
	if (cached && now - cached.fetchedAt < revalidate * 1000) {
		return cached.config;
	}

	let lastError: unknown = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const controller =
				typeof AbortController !== "undefined" ? new AbortController() : null;
			const timer = controller
				? setTimeout(() => controller.abort(), timeoutMs)
				: null;

			const fetchOptions: RequestInit & {
				next?: { revalidate?: number; tags?: string[] };
			} = {
				next: {
					revalidate,
					tags: [`adinject-config-${projectId}`],
				},
				headers: {
					Accept: "application/json",
				},
				signal: controller?.signal,
			};

			const res = await fetch(targetUrl, fetchOptions as RequestInit);
			if (timer) clearTimeout(timer);

			if (res.ok) {
				const data: AdInjectProjectConfig = await res.json();
				// Update SWR cache
				swrCache.set(projectId, { config: data, fetchedAt: Date.now() });
				return data;
			}

			// Don't retry on 404 (project does not exist)
			if (res.status === 404) {
				console.warn(`[AdInject] Project not found (404): ${projectId}`);
				return fallbackConfig || null;
			}

			// Transient 5xx status: retry with backoff
			lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
		} catch (err) {
			lastError = err;
		}

		// Wait exponential backoff before retrying
		if (attempt < maxRetries) {
			const backoffDelay = Math.min(100 * 2 ** attempt, 1000);
			await new Promise((resolve) => setTimeout(resolve, backoffDelay));
		}
	}

	console.warn(
		`[AdInject] Failed to fetch remote config for ${projectId} after ${maxRetries + 1} attempts. Falling back:`,
		lastError,
	);

	// Return cached stale data if available, or static fallbackConfig
	if (cached) {
		return cached.config;
	}

	return fallbackConfig || null;
}
