"use client";

import React, { useMemo } from "react";
import type {
  AffiliateABTest,
  AffiliateCardVariant,
  AffiliateClickEvent,
} from "../types";
import { pickABVariant, trackAffiliateClick } from "../utils/affiliate-utils";
import { AffiliateCard } from "./AffiliateCard";

export interface AffiliateABSlotProps {
  test: AffiliateABTest;
  variant?: AffiliateCardVariant;
  className?: string;
  style?: React.CSSProperties;
  onAffiliateClick?: (event: AffiliateClickEvent) => void;
}

/**
 * AffiliateABSlot
 * Dynamically selects and renders one of several affiliate product variants to A/B test conversion rates.
 */
export function AffiliateABSlot({
  test,
  variant = "card",
  className = "",
  style,
  onAffiliateClick,
}: AffiliateABSlotProps) {
  const chosenProduct = useMemo(() => {
    return pickABVariant(test);
  }, [test]);

  const handleClick = (event: AffiliateClickEvent) => {
    const enrichedEvent: AffiliateClickEvent = {
      ...event,
      placement: `ab-test:${test.id}`,
      metadata: {
        ...event.metadata,
        abTestId: test.id,
        variantCount: test.variants.length,
      },
    };
    trackAffiliateClick(enrichedEvent, onAffiliateClick);
  };

  if (!chosenProduct) return null;

  return (
    <AffiliateCard
      product={chosenProduct}
      variant={variant}
      placement={`ab-test:${test.id}`}
      className={`adinject-ab-slot ${className}`}
      style={style}
      onAffiliateClick={handleClick}
    />
  );
}
