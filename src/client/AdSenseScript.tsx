"use client";

import React, { useEffect } from "react";

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
  nonce,
}: AdSenseScriptProps) {
  useEffect(() => {
    if (!client) return;

    const scriptId = `adinject-adsense-script-${client}`;
    if (document.getElementById(scriptId)) {
      return; // Deduplicate
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      client,
    )}`;
    script.async = true;
    script.crossOrigin = crossOrigin;
    if (nonce) script.nonce = nonce;

    document.head.appendChild(script);
  }, [client, crossOrigin, nonce]);

  return null;
}
