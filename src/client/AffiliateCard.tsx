"use client";

import React from "react";
import type {
  AffiliateCardVariant,
  AffiliateClickEvent,
  AffiliateProduct,
} from "../types";
import { trackAffiliateClick } from "../utils/affiliate-utils";

export interface AffiliateCardProps {
  product: AffiliateProduct;
  variant?: AffiliateCardVariant;
  placement?: string;
  showRating?: boolean;
  showPrice?: boolean;
  showMerchant?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onAffiliateClick?: (event: AffiliateClickEvent) => void;
}

export function AffiliateCard({
  product,
  variant = "card",
  placement = "affiliate-card",
  showRating = true,
  showPrice = true,
  showMerchant = true,
  className = "",
  style,
  onAffiliateClick,
}: AffiliateCardProps) {
  const handleClick = () => {
    const event: AffiliateClickEvent = {
      productId: product.id,
      productTitle: product.title,
      targetUrl: product.targetUrl,
      merchant: product.merchant,
      placement,
      timestamp: Date.now(),
      pathname: typeof window !== "undefined" ? window.location.pathname : undefined,
    };
    trackAffiliateClick(event, onAffiliateClick);
  };

  const formattedPrice =
    typeof product.price === "number"
      ? `${product.currency || "$"}${product.price.toFixed(2)}`
      : product.price;

  const formattedOriginalPrice =
    typeof product.originalPrice === "number"
      ? `${product.currency || "$"}${product.originalPrice.toFixed(2)}`
      : product.originalPrice;

  // 1. Minimal Variant (inline callout badge / text)
  if (variant === "minimal") {
    return (
      <a
        href={product.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className={`adinject-affiliate-minimal inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors ${className}`}
        style={{ textDecoration: "none", ...product.customStyle, ...style }}
      >
        <span className="font-semibold">{product.title}</span>
        {formattedPrice && <span className="opacity-80">({formattedPrice})</span>}
        <span className="text-[10px]">↗</span>
      </a>
    );
  }

  // 2. Compact Variant (small horizontal list item)
  if (variant === "compact") {
    return (
      <a
        href={product.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className={`adinject-affiliate-compact group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-accent/20 transition-all ${className}`}
        style={{ textDecoration: "none", ...product.customStyle, ...style }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {product.imageUrl && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.imageAlt || product.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {product.title}
            </h4>
            {showMerchant && product.merchant && (
              <span className="text-[10px] text-muted-foreground block">
                via {product.merchant}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showPrice && formattedPrice && (
            <span className="text-xs font-bold text-foreground">
              {formattedPrice}
            </span>
          )}
          <span className="text-xs font-medium text-primary px-2.5 py-1 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            {product.ctaText || "View"} →
          </span>
        </div>
      </a>
    );
  }

  // 3. Horizontal Variant (wide in-article review / feature box)
  if (variant === "horizontal") {
    return (
      <div
        className={`adinject-affiliate-horizontal group relative flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-md ${className}`}
        style={{ ...product.customStyle, ...style }}
      >
        {product.imageUrl && (
          <div className="relative h-32 w-32 sm:h-36 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-muted/60 border border-border/40 p-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.imageAlt || product.title}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex-1 space-y-2 text-left w-full">
          <div className="flex flex-wrap items-center gap-2">
            {product.badgeText && (
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {product.badgeText}
              </span>
            )}
            {showMerchant && product.merchant && (
              <span className="text-[11px] text-muted-foreground font-medium">
                • {product.merchant}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-foreground leading-snug">
            {product.title}
          </h3>

          {showRating && product.rating && (
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
              <span>★ {product.rating.toFixed(1)}</span>
              {product.reviewCount && (
                <span className="text-muted-foreground text-[11px]">
                  ({product.reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-baseline gap-2">
              {showPrice && formattedPrice && (
                <span className="text-lg font-bold text-foreground">
                  {formattedPrice}
                </span>
              )}
              {formattedOriginalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>

            <a
              href={product.targetUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all"
              style={{ textDecoration: "none" }}
            >
              <span>{product.ctaText || "Check Price"}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default "card" Variant (grid / catalog native)
  return (
    <div
      className={`adinject-affiliate-card group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 text-card-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-md ${className}`}
      style={{
        boxSizing: "border-box",
        minHeight: "340px",
        ...product.customStyle,
        ...style,
      }}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {product.badgeText ? (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {product.badgeText}
            </span>
          ) : (
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Recommended
            </span>
          )}

          {showMerchant && product.merchant && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {product.merchant}
            </span>
          )}
        </div>

        {/* Product Image */}
        {product.imageUrl && (
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted/40 border border-border/40 p-3 mb-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.imageAlt || product.title}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Rating */}
        {showRating && product.rating && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium mb-1">
            <span>★ {product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-muted-foreground text-[10px]">
                ({product.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {product.title}
        </h4>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* Footer Price & CTA */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-col">
          {showPrice && formattedPrice && (
            <span className="text-base font-bold text-foreground">
              {formattedPrice}
            </span>
          )}
          {formattedOriginalPrice && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formattedOriginalPrice}
            </span>
          )}
        </div>

        <a
          href={product.targetUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all shrink-0"
          style={{ textDecoration: "none" }}
        >
          <span>{product.ctaText || "Buy Now"}</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}
