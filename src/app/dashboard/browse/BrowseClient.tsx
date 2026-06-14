"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useEntitlements } from "@/components/EntitlementsProvider";
import { useLocalList, type LocalProduct } from "@/hooks/useLocalList";

interface Category {
  id: string;
  name: string;
}

export function BrowseClient() {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const search = useSearchParams();
  const features = useEntitlements();
  const cart = useLocalList("cart");
  const wishlist = useLocalList("wishlist");

  const [q, setQ] = useState(search.get("q") || "");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async (query: string, cat: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (cat) params.set("category", cat);
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = res.ok ? await res.json() : { products: [] };
    setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(search.get("q") || "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.replace(`/dashboard/browse${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    load(q, category);
  }

  function addToCart(p: Omit<LocalProduct, "addedAt">) {
    if (!features.cart) return router.push("/dashboard/pay");
    const r = cart.add(p);
    if (r.ok) toast(t("toast.addedToCart"));
    else if (r.reason === "full") toast(t("toast.cartFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
  }

  function addToWishlist(p: Omit<LocalProduct, "addedAt">) {
    if (!features.wishlist) return router.push("/dashboard/pay");
    const r = wishlist.add(p);
    if (r.ok) toast(t("toast.addedToWishlist"));
    else if (r.reason === "full") toast(t("toast.wishlistFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-ink">{t("browse.title")}</h1>

      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("browse.searchPlaceholder")}
          className="input flex-1 min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            load(q, e.target.value);
          }}
          className="input max-w-[180px]"
        >
          <option value="">{t("browse.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          {t("nav.search")}
        </button>
      </form>

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <EmptyState icon="search" message={t("browse.noResults")} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <ProductCard
              key={p.productId}
              product={p}
              actionLabel={t("link.addToCart")}
              onAction={() =>
                addToCart({
                  productId: p.productId,
                  title: p.title,
                  imageUrl: p.imageUrl,
                  salePrice: p.salePrice,
                  currency: p.currency,
                  sourceUrl: p.sourceUrl,
                })
              }
              onWishlist={() =>
                addToWishlist({
                  productId: p.productId,
                  title: p.title,
                  imageUrl: p.imageUrl,
                  salePrice: p.salePrice,
                  currency: p.currency,
                  sourceUrl: p.sourceUrl,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
