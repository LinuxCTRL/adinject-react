import { describe, expect, it, mock } from "bun:test";
import { type AdInjectProjectConfig, fetchAdInjectConfig } from "../src/api/config-client";

const MOCK_CONFIG: AdInjectProjectConfig = {
	projectId: "proj_test_app",
	name: "Test App",
	domain: "test.example.com",
	status: "active",
	rules: [],
	adUnits: {},
};

const FALLBACK_CONFIG: AdInjectProjectConfig = {
	projectId: "proj_fallback",
	name: "Fallback Config",
	domain: "fallback.example.com",
	status: "active",
	rules: [],
	adUnits: {},
};

describe("Edge API Client Resilience (fetchAdInjectConfig)", () => {
	it("returns null when projectId is empty and no fallback is provided", async () => {
		const res = await fetchAdInjectConfig({ projectId: "" });
		expect(res).toBeNull();
	});

	it("returns fallbackConfig immediately when projectId is empty", async () => {
		const res = await fetchAdInjectConfig({
			projectId: "",
			fallbackConfig: FALLBACK_CONFIG,
		});
		expect(res).toEqual(FALLBACK_CONFIG);
	});

	it("fetches and caches valid configuration successfully", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(MOCK_CONFIG), { status: 200 })),
		) as unknown as typeof fetch;

		try {
			const res = await fetchAdInjectConfig({
				projectId: "proj_test_app",
				baseUrl: "https://api.adinject.io",
			});

			expect(res).not.toBeNull();
			expect(res?.projectId).toBe("proj_test_app");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("falls back to fallbackConfig on network failure after retries", async () => {
		const originalFetch = globalThis.fetch;
		let callCount = 0;
		globalThis.fetch = mock(() => {
			callCount++;
			return Promise.reject(new Error("Network connection dropped"));
		}) as unknown as typeof fetch;

		try {
			const res = await fetchAdInjectConfig({
				projectId: "proj_unreachable",
				baseUrl: "https://down.adinject.io",
				maxRetries: 2,
				fallbackConfig: FALLBACK_CONFIG,
			});

			expect(callCount).toBe(3); // 1 initial + 2 retries
			expect(res).toEqual(FALLBACK_CONFIG);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
