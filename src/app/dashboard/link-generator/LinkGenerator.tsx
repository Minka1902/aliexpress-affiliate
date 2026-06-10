"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocalList, type LocalProduct } from "@/hooks/useLocalList";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useEntitlements } from "@/components/EntitlementsProvider";

interface Similar extends ProductCardData {
  sourceUrl: string;
}
interface Result {
  id: string;
  sourceUrl: string;
  productId: string | null;
  eligible: boolean;
  proxyUrl: string | null;
  product: { title?: string; imageUrl?: string; salePrice?: string } | null;
  similar: Similar[];
  error?: string;
}

async function makeQr(text: string): Promise<string> {
  const QR = await import("qrcode");
  return QR.toDataURL(text, { width: 160, margin: 1 });
}

export function LinkGenerator() {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const features = useEntitlements();
  const search = useSearchParams();
  const cart = useLocalList("cart");
  const wishlist = useLocalList("wishlist");

  function addToCart(p: Omit<LocalProduct, "addedAt">) {
    if (!features.cart) {
      router.push("/dashboard/pay");
      return;
    }
    const r = cart.add(p);
    if (r.ok) toast(t("toast.addedToCart"));
    else if (r.reason === "full") toast(t("toast.cartFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
  }

  function addToWishlist(p: Omit<LocalProduct, "addedAt">) {
    if (!features.wishlist) {
      router.push("/dashboard/pay");
      return;
    }
    const r = wishlist.add(p);
    if (r.ok) toast(t("toast.addedToWishlist"));
    else if (r.reason === "full") toast(t("toast.wishlistFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
  }
  const [text, setText] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Web Share Target: prefill from ?shared= / ?text= / ?url=
  useEffect(() => {
    const shared = search.get("shared") || search.get("url") || search.get("text");
    if (shared) setText((prev) => (prev ? prev : shared));
  }, [search]);

  async function submit() {
    const urls = text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (urls.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/link/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setResults(data.results || []);
    // Generate QR codes for eligible proxy links.
    const qrs: Record<string, string> = {};
    for (const r of data.results as Result[]) {
      if (r.proxyUrl) qrs[r.id] = await makeQr(r.proxyUrl);
    }
    setQr(qrs);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast(t("toast.copied"));
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card" data-tour="search">
        <h1 className="text-lg font-semibold mb-3 text-ink">{t("link.title")}</h1>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t("link.placeholder")}
          className="input resize-y"
        />
        <button onClick={submit} disabled={loading} className="btn-primary mt-3 inline-flex items-center gap-2">
          {loading && <span className="spinner" />}
          {loading ? t("common.loading") : t("link.generate")}
        </button>
      </div>

      {loading && results.length === 0 && <ProductGridSkeleton count={4} />}

      {results.map((r) => (
        <div key={r.id} className="card">
          {r.eligible && r.proxyUrl ? (
            <div className="flex flex-col sm:flex-row gap-4">
              {r.product?.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.product.imageUrl} alt="" className="w-24 h-24 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mb-1">
                  ✓ {t("link.eligible")}
                </span>
                <p className="text-sm text-ink line-clamp-2">{r.product?.title || r.productId}</p>
                <div className="flex items-center gap-2 mt-2">
                  <input readOnly value={r.proxyUrl} className="input text-xs flex-1" />
                  <button onClick={() => copy(r.proxyUrl!, r.id)} className="btn-primary text-sm">
                    {copied === r.id ? t("link.copied") : t("link.copy")}
                  </button>
                </div>
                <button
                  onClick={() =>
                    addToCart({
                      productId: r.productId || r.id,
                      title: r.product?.title,
                      imageUrl: r.product?.imageUrl,
                      salePrice: r.product?.salePrice,
                      sourceUrl: r.sourceUrl,
                      proxyUrl: r.proxyUrl || undefined,
                    })
                  }
                  className="mt-2 text-sm text-brand font-medium"
                >
                  + {t("link.addToCart")}
                </button>
              </div>
              {qr[r.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr[r.id]} alt="QR" className="w-28 h-28 self-center" />
              )}
            </div>
          ) : (
            <div>
              <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded mb-1">
                ✕ {t("link.notEligible")}
              </span>
              <p className="text-sm text-ink-muted break-all">{r.sourceUrl}</p>
              <button
                onClick={() =>
                  r.productId &&
                  addToWishlist({ productId: r.productId, sourceUrl: r.sourceUrl })
                }
                className="mt-2 text-sm text-brand font-medium"
              >
                ♡ {t("link.addToWishlist")}
              </button>
              {r.similar.length > 0 && (
                <>
                  <p className="text-sm text-ink mt-4 mb-2">{t("link.whyNotEligible")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {r.similar.map((p) => (
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
                            sourceUrl: p.sourceUrl,
                          })
                        }
                        onWishlist={() =>
                          addToWishlist({
                            productId: p.productId,
                            title: p.title,
                            imageUrl: p.imageUrl,
                            salePrice: p.salePrice,
                            sourceUrl: p.sourceUrl,
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
