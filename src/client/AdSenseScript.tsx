"use client";

import { useEffect } from "react";

export interface AdSenseScriptProps {
	client: string; // e.g. "ca-pub-1234567890123456"
	crossOrigin?: "anonymous" | "use-credentials";
	strategy?: "afterInteractive" | "lazyOnload" | "beforeInteractive";
	nonce?: string;
}

/**
 * AdSenseScript
 * Robust script loader for Google AdSense on Next.js App Router (Next 14, 15, 16 & React 19).
 * Handles global deduplication and non-blocking script injection.
 */
export function AdSenseScript({
	client,
	crossOrigin = "anonymous",
	strategy = "afterInteractive",
	nonce,
}: AdSenseScriptProps) {
	useEffect(() => {
		if (!client || typeof document === "undefined") return;

		const scriptId = `adinject-adsense-script-${client}`;
		if (document.getElementById(scriptId)) {
			return; // Deduplicate
		}

		// Ensure dataLayer exists before AdSense script executes
		if (typeof window !== "undefined") {
			window.dataLayer = window.dataLayer || [];
		}

		const inject = () => {
			if (document.getElementById(scriptId)) return;
			const script = document.createElement("script");
			script.id = scriptId;
			script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
				client,
			)}`;
			script.async = true;
			script.crossOrigin = crossOrigin;
			if (nonce) script.nonce = nonce;

			document.head.appendChild(script);
		};

		if (strategy === "lazyOnload") {
			if (document.readyState === "complete") {
				if ("requestIdleCallback" in window) {
					const handle = window.requestIdleCallback(inject);
					return () => window.cancelIdleCallback(handle);
				}
				const timer = setTimeout(inject, 200);
				return () => clearTimeout(timer);
			}

			const onWindowLoad = () => {
				if ("requestIdleCallback" in window) {
					window.requestIdleCallback(inject);
				} else {
					setTimeout(inject, 200);
				}
			};
			window.addEventListener("load", onWindowLoad, { once: true });
			return () => window.removeEventListener("load", onWindowLoad);
		}

		inject();
	}, [client, crossOrigin, strategy, nonce]);

	return null;
}
