"use client";

import React from "react";
import { AdSenseSlot } from "./AdSenseSlot";
import type { AdUnit } from "../types";

export interface InFeedAdCardProps {
  adUnit: AdUnit;
  slotIndex?: number;
  gridSpan?: "card" | "full_width";
  testMode?: boolean;
  debug?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * InFeedAdCard
 * Specialized native card ad component tailored for card grids (recipe listings, e-commerce, catalogs).
 * Matches standard card dimensions and prevents layout shifts.
 */
export function InFeedAdCard({
  adUnit,
  slotIndex = 0,
  gridSpan = "card",
  testMode = false,
  debug = false,
  className = "",
  style,
}: InFeedAdCardProps) {
  const isFullWidth = gridSpan === "full_width";

  return (
    <div
      className={`adinject-in-feed-card ${isFullWidth ? "adinject-span-full" : "adinject-span-card"} ${className}`}
      style={{
        position: "relative",
        borderRadius: "16px",
        border: "1px dashed rgba(var(--primary-rgb, 59, 130, 246), 0.3)",
        backgroundColor: "rgba(var(--card-rgb, 255, 255, 255), 0.6)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: isFullWidth ? "140px" : "320px",
        gridColumn: isFullWidth ? "1 / -1" : undefined,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Header Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "12px",
          width: "100%",
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          fontSize: "11px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: 0.7,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "9999px",
              backgroundColor: "var(--primary, #3b82f6)",
            }}
          />
          <span>Sponsored</span>
        </div>

        <span
          style={{
            fontSize: "9px",
            fontFamily: "monospace",
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: "rgba(var(--primary-rgb, 59, 130, 246), 0.08)",
            color: "var(--primary, #3b82f6)",
          }}
        >
          In-Feed #{slotIndex + 1}
        </span>
      </div>

      {/* Main Ad Slot Container */}
      <div
        style={{
          padding: "12px 0",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <AdSenseSlot
          client={adUnit.client}
          slot={adUnit.slot}
          format={isFullWidth ? "horizontal" : adUnit.format || "rectangle"}
          responsive={adUnit.responsive ?? true}
          testMode={testMode || adUnit.testMode}
          debug={debug}
          fallback={adUnit.fallback}
          className="w-full"
        />
      </div>

      {/* Footer attribution */}
      <div
        style={{
          paddingTop: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "10px",
          opacity: 0.5,
          fontFamily: "monospace",
        }}
      >
        <span>Zero CLS Guarded</span>
        <span>AdInject Engine</span>
      </div>
    </div>
  );
}
