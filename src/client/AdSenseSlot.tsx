"use client";

import React, { useEffect, useRef, useState } from "react";
import { AdFallback } from "./AdFallback";
import type { AdDimensions, AdFormat, AdStatus, FallbackBanner } from "../types";

// Global declaration for Google AdSense array
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export interface AdSenseSlotProps {
  client: string; // e.g. "ca-pub-1234567890123456"
  slot: string; // e.g. "9876543210"
  format?: AdFormat;
  responsive?: boolean;
  layoutKey?: string;
  dimensions?: AdDimensions;
  fallback?: FallbackBanner;
  testMode?: boolean;
  lazyLoad?: boolean;
  debug?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onStatusChange?: (status: AdStatus) => void;
}

const DEFAULT_DIMENSIONS: Record<AdFormat, AdDimensions> = {
  rectangle: { minHeight: 250, aspectRatio: "300/250" },
  horizontal: { minHeight: 90, aspectRatio: "728/90" },
  vertical: { minHeight: 600, aspectRatio: "160/600" },
  fluid: { minHeight: 250 },
  auto: { minHeight: 250 },
  custom: { minHeight: 250 },
};

/**
 * AdSenseSlot
 * Next-generation AdSense React component guaranteeing zero Cumulative Layout Shift (CLS),
 * lazy loading via IntersectionObserver, and unfilled / adblock fallback banners.
 */
export function AdSenseSlot({
  client,
  slot,
  format = "auto",
  responsive = true,
  layoutKey,
  dimensions,
  fallback,
  testMode = false,
  lazyLoad = true,
  debug = false,
  className = "",
  style,
  onStatusChange,
}: AdSenseSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPushedRef = useRef(false);
  const [status, setStatus] = useState<AdStatus>("idle");
  const [isVisible, setIsVisible] = useState(!lazyLoad);

  const effectiveDimensions = {
    ...DEFAULT_DIMENSIONS[format],
    ...dimensions,
  };

  const updateStatus = (newStatus: AdStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  // 1. IntersectionObserver for zero-jank lazy loading
  useEffect(() => {
    if (!lazyLoad) {
      setIsVisible(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [lazyLoad]);

  // 2. Safe Google adsbygoogle.push() execution
  useEffect(() => {
    if (!isVisible || isPushedRef.current) return;

    if (testMode) {
      updateStatus("rendered");
      isPushedRef.current = true;
      return;
    }

    updateStatus("loading");

    const pushTimer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          isPushedRef.current = true;
          updateStatus("rendered");
        }
      } catch (err) {
        console.warn("[AdInject] adsbygoogle.push error:", err);
        updateStatus("error");
      }
    }, 50);

    return () => clearTimeout(pushTimer);
  }, [isVisible, testMode]);

  // 3. Fallback unfill detection check
  useEffect(() => {
    if (testMode || !isPushedRef.current) return;

    const checkTimer = setTimeout(() => {
      const el = containerRef.current?.querySelector(".adsbygoogle");
      if (el) {
        const adStatus = el.getAttribute("data-ad-status");
        if (adStatus === "unfilled" || el.innerHTML.trim() === "") {
          updateStatus("unfilled");
        }
      }
    }, 2500);

    return () => clearTimeout(checkTimer);
  }, [testMode]);

  const containerStyle: React.CSSProperties = {
    minHeight: effectiveDimensions.minHeight,
    aspectRatio: effectiveDimensions.aspectRatio,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={`adinject-slot-container ${className}`}
      style={containerStyle}
      data-adinject-slot={slot}
      data-adinject-status={status}
    >
      {/* Test Mode Mock UI */}
      {testMode && (
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: effectiveDimensions.minHeight,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            border: "1px dashed rgba(var(--primary-rgb, 59, 130, 246), 0.3)",
            borderRadius: "12px",
            backgroundColor: "rgba(var(--primary-rgb, 59, 130, 246), 0.03)",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--primary, #3b82f6)",
              marginBottom: "4px",
            }}
          >
            ● Google AdSense Test Slot
          </div>
          <div
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              opacity: 0.7,
            }}
          >
            Slot: {slot} | Format: {format}
          </div>
          <div
            style={{
              fontSize: "9px",
              opacity: 0.5,
              marginTop: "4px",
            }}
          >
            Zero CLS Reserved: {effectiveDimensions.minHeight}px
          </div>
        </div>
      )}

      {/* Fallback Banner */}
      {!testMode && (status === "unfilled" || status === "error") && fallback && (
        <div style={{ width: "100%" }}>
          <AdFallback fallback={fallback} />
        </div>
      )}

      {/* Live Google AdSense Ins Tag */}
      {!testMode && (
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            minHeight: effectiveDimensions.minHeight,
          }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
          data-ad-layout-key={layoutKey}
        />
      )}
    </div>
  );
}
