import type { AdUnit, PlacementRule } from "../types";

export interface AdInjectProjectConfig {
  projectId: string;
  name: string;
  domain: string;
  status: "active" | "setup_pending";
  rules: PlacementRule[];
  adUnits: Record<string, AdUnit>;
  updatedAt?: string;
}

export interface FetchAdInjectConfigOptions {
  projectId: string;
  baseUrl?: string;
  revalidate?: number; // default: 300 seconds (5 minutes ISR)
}

/**
 * Fetches compiled project rules, ad units, and fallback settings from the AdInject Edge API.
 * Uses Next.js ISR (revalidate) for high performance caching.
 *
 * @example
 * ```tsx
 * const config = await fetchAdInjectConfig({ projectId: "proj_lady_recipes" });
 * ```
 */
export async function fetchAdInjectConfig({
  projectId,
  baseUrl = process.env.NEXT_PUBLIC_ADINJECT_API_URL || "https://adinject.io",
  revalidate = 300,
}: FetchAdInjectConfigOptions): Promise<AdInjectProjectConfig | null> {
  if (!projectId) return null;

  try {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
      next: { revalidate },
      headers: {
        Accept: "application/json",
      },
    };

    const res = await fetch(
      `${cleanUrl}/api/v1/config/${encodeURIComponent(projectId)}`,
      fetchOptions as RequestInit,
    );

    if (!res.ok) {
      console.warn(
        `[AdInject] Failed to fetch project config (${res.status}): ${projectId}`,
      );
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(
      `[AdInject] Error fetching project config for ${projectId}:`,
      err,
    );
    return null;
  }
}
