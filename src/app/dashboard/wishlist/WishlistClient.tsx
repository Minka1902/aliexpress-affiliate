"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocalList, type LocalProduct } from "@/hooks/useLocalList";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useEntitlements } from "@/components/EntitlementsProvider";
import { Paywall } from "@/components/Paywall";

interface Suggestion {
  productId: string;
  title?: string;
  imageUrl?: string;
  salePrice?: string;
  currency?: string;
  sourceUrl: string;
}
interface RecheckResult {
  productId: string;
  nowEligible: boolean;
  proxyUrl?: string;
  product?: { title?: string; imageUrl?: string; salePrice?: string };
  suggestion?: Suggestion;
}
interface RecheckResponse {
  results: RecheckResult[];
}

export function WishlistClient() {
  const t = useTranslations();
  const { toast } = useToast();
  const features = useEntitlements();
  const wishlist = useLocalList("wishlist");
  const cart = useLocalList("cart");
  const [results, setResults] = useState<Record<string, RecheckResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({});
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!features.wishlist || !wishlist.ready || checkedRef.current) return;
    checkedRef.current = true;
    if (wishlist.items.length === 0) return;

    const ids = wishlist.items.map((p) => p.productId).slice(0, 10);
    setLoading(true);
    setError(false);
    fetch("/api/wishlist/recheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids }),
    })
      .then((res) => res.json() as Promise<RecheckResponse>)
      .then((data) => {
        const map: Record<string, RecheckResult> = {};
        for (const r of data.results || []) map[r.productId] = r;
        setResults(map);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [features.wishlist, wishlist.ready, wishlist.items]);

  function copyLink(id: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    toast(t("toast.copied"));
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  }

  function reportAdd(productId: string, r: { ok: boolean; reason?: "exists" | "full" }) {
    if (r.ok) toast(t("toast.addedToCart"));
    else if (r.reason === "full") toast(t("toast.cartFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
    setAdded((prev) => ({
      ...prev,
      [productId]: r.ok
        ? t("link.addToCart")
        : r.reason === "full"
          ? t("cart.max")
          : t("toast.alreadyAdded"),
    }));
  }

  function addToCart(p: Omit<LocalProduct, "addedAt">) {
    reportAdd(p.productId, cart.add(p));
  }

  function addSuggestion(s: Suggestion) {
    reportAdd(
      s.productId,
      cart.add({
        productId: s.productId,
        title: s.title,
        imageUrl: s.imageUrl,
        salePrice: s.salePrice,
        currency: s.currency,
        sourceUrl: s.sourceUrl,
      })
    );
  }

  if (!features.wishlist) return <Paywall title={t("pay.featureWishlist")} />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-ink">
        {t("wishlist.title")}
        {wishlist.ready && wishlist.items.length > 0 && (
          <span className="text-ink-muted font-normal"> ({wishlist.items.length})</span>
        )}
      </h1>

      {!wishlist.ready ? (
        <p className="text-ink-muted">{t("common.loading")}</p>
      ) : wishlist.items.length === 0 ? (
        <EmptyState
          icon="♡"
          message={t("wishlist.empty")}
          ctaHref="/dashboard/link-generator"
          ctaLabel={t("nav.linkGenerator")}
        />
      ) : (
        <>
          {loading && <p className="text-sm text-ink-muted">{t("common.loading")}</p>}
          {error && (
            <div className="card border border-red-200 bg-red-50 text-red-700 text-sm">
              {t("common.error")}
            </div>
          )}

          <ul className="flex flex-col gap-4">
            {wishlist.items.map((p) => {
              const res = results[p.productId];
              const title = res?.product?.title || p.title || p.productId;
              const imageUrl = res?.product?.imageUrl || p.imageUrl;
              return (
                <li key={p.productId} className="card flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 shrink-0 rounded-card overflow-hidden bg-surface-2">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                          no image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-sm text-ink line-clamp-2">{title}</p>
                      {res?.product?.salePrice && (
                        <span className="text-price font-bold">
                          {p.currency} {res.product.salePrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        wishlist.remove(p.productId);
                        toast(t("common.remove"), "info");
                      }}
                      className="self-start text-sm text-ink-muted hover:text-brand"
                    >
                      {t("common.remove")}
                    </button>
                  </div>

                  {res?.nowEligible && res.proxyUrl && (
                    <div className="border border-green-200 bg-green-50 rounded-card p-3 flex flex-col gap-2">
                      <p className="text-sm font-medium text-green-800">
                        {t("wishlist.nowEligible")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => copyLink(p.productId, res.proxyUrl!)}
                          className="rounded-full px-4 py-1.5 text-sm border border-line bg-surface text-ink hover:bg-surface-2"
                        >
                          {copied === p.productId ? t("link.copied") : t("link.copy")}
                        </button>
                        <button
                          onClick={() =>
                            addToCart({
                              productId: p.productId,
                              title,
                              imageUrl,
                              salePrice: res.product?.salePrice || p.salePrice,
                              currency: p.currency,
                              sourceUrl: p.sourceUrl,
                              proxyUrl: res.proxyUrl,
                            })
                          }
                          className="rounded-full px-4 py-1.5 text-sm bg-brand-gradient text-white font-medium hover:opacity-90"
                        >
                          {added[p.productId] || t("link.addToCart")}
                        </button>
                      </div>
                    </div>
                  )}

                  {res && !res.nowEligible && res.suggestion && (
                    <div className="border-t border-line pt-3 flex flex-col gap-2">
                      <p className="text-sm text-ink-muted">{t("wishlist.stillNot")}</p>
                      <div className="max-w-[220px]">
                        <ProductCard
                          product={res.suggestion as ProductCardData}
                          actionLabel={
                            added[res.suggestion.productId] || t("link.addToCart")
                          }
                          onAction={() => addSuggestion(res.suggestion!)}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
