"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";

export interface ProductCardData {
  productId: string;
  title?: string;
  imageUrl?: string;
  salePrice?: string;
  originalPrice?: string;
  currency?: string;
  discount?: string;
  rating?: string;
  orders?: number;
  sourceUrl?: string;
  freeShipping?: boolean;
  estimatedDeliveryDays?: number;
}

function Stars({ rating }: { rating: string }) {
  // rating is typically a percentage like "93.5%" — map to 0..5 stars.
  const pct = parseFloat(rating.replace("%", ""));
  if (isNaN(pct)) return null;
  const stars = Math.round((pct / 100) * 5);
  return (
    <span className="text-amber-500" aria-label={`${stars} of 5`}>
      {"★".repeat(stars)}
      <span className="text-line">{"★".repeat(5 - stars)}</span>
    </span>
  );
}

export function ProductCard({
  product,
  actionLabel,
  onAction,
  onWishlist,
  wishlisted,
}: {
  product: ProductCardData;
  actionLabel?: string;
  onAction?: (p: ProductCardData) => void;
  onWishlist?: (p: ProductCardData) => void;
  wishlisted?: boolean;
}) {
  const t = useTranslations();
  const { title, imageUrl, salePrice, originalPrice, currency, discount, rating, orders, freeShipping, estimatedDeliveryDays } =
    product;
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="group bg-surface border border-line rounded-card overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="relative aspect-square bg-surface-2">
        {imageUrl ? (
          <>
            {!imgLoaded && <div className="skeleton absolute inset-0" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title || "product"}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
            no image
          </div>
        )}
        {discount && (
          <span className="absolute top-2 start-2 bg-brand text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            -{discount}
          </span>
        )}
        {onWishlist && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onWishlist(product);
            }}
            aria-label="wishlist"
            className={`absolute top-2 end-2 w-7 h-7 rounded-full bg-surface/90 border border-line flex items-center justify-center hover:scale-110 transition ${
              wishlisted ? "text-brand" : "text-ink-muted"
            }`}
          >
            <Icon name={wishlisted ? "heartFilled" : "heart"} size={16} />
          </button>
        )}
      </div>
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-sm line-clamp-2 text-ink min-h-[2.5rem]">{title || product.productId}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-price font-bold">
            {currency} {salePrice || "—"}
          </span>
          {originalPrice && (
            <span className="text-ink-muted text-xs line-through">{originalPrice}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-ink-muted">
          {rating ? <Stars rating={rating} /> : <span />}
          {orders ? <span>{orders} sold</span> : <span />}
        </div>
        {freeShipping && (
          <span className="self-start text-[10px] text-green-700 bg-green-100 rounded px-1.5 py-0.5">
            {t("card.freeShipping")}
          </span>
        )}
        {estimatedDeliveryDays ? (
          <span className="text-[10px] text-ink-muted">
            {t("card.deliveryDays", { days: estimatedDeliveryDays })}
          </span>
        ) : null}
        {actionLabel && onAction && (
          <button
            onClick={() => onAction(product)}
            className="mt-1 bg-brand-gradient text-white text-sm rounded-full py-1.5 font-medium hover:opacity-90"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
