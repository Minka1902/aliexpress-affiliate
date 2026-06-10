"use client";

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
}

export function ProductCard({
  product,
  actionLabel,
  onAction,
}: {
  product: ProductCardData;
  actionLabel?: string;
  onAction?: (p: ProductCardData) => void;
}) {
  const { title, imageUrl, salePrice, originalPrice, currency, discount, rating, orders } = product;
  return (
    <div className="bg-surface border border-line rounded-card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-surface-2">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title || "product"} className="w-full h-full object-cover" />
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
          {rating && <span>★ {rating}</span>}
          {orders ? <span>{orders} sold</span> : <span />}
        </div>
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
