"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocalList, type LocalProduct } from "@/hooks/useLocalList";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useEntitlements } from "@/components/EntitlementsProvider";
import { Paywall } from "@/components/Paywall";

type Verdict = "Safe" | "Caution" | "Avoid";

interface ReviewVerdict {
  productId: string;
  verdict: Verdict;
  reasons: string[];
}
interface ReviewResponse {
  free: boolean;
  verdicts: ReviewVerdict[];
  raw?: string;
  error?: string;
}

interface CouponDeal {
  productId: string;
  bestPrice?: string;
  coupons: string[];
  tips: string[];
}
interface CouponResponse {
  free: boolean;
  deals: CouponDeal[];
  raw?: string;
  error?: string;
}

interface AiState {
  loading: boolean;
  error: string | null;
  noAi: boolean;
  free: boolean;
  verdicts: Record<string, ReviewVerdict>;
  deals: Record<string, CouponDeal>;
}

const VERDICT_STYLES: Record<Verdict, string> = {
  Safe: "bg-green-100 text-green-800 border border-green-200",
  Caution: "bg-amber-100 text-amber-800 border border-amber-200",
  Avoid: "bg-red-100 text-red-700 border border-red-200",
};

export function CartClient() {
  const t = useTranslations();
  const { toast } = useToast();
  const features = useEntitlements();
  const cart = useLocalList("cart");
  const [ai, setAi] = useState<AiState | null>(null);

  async function runAiCheck() {
    if (!features.ai) {
      toast(t("pay.goUnlock"), "info");
      return;
    }
    const payload = {
      products: cart.items.map((p) => ({
        productId: p.productId,
        title: p.title,
        url: p.sourceUrl,
      })),
    };
    setAi({
      loading: true,
      error: null,
      noAi: false,
      free: false,
      verdicts: {},
      deals: {},
    });
    try {
      const [reviewRes, couponRes] = await Promise.all([
        fetch("/api/ai/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch("/api/ai/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);
      const review = (await reviewRes.json()) as ReviewResponse;
      const coupons = (await couponRes.json()) as CouponResponse;

      const noAi = review.error === "no_ai" || coupons.error === "no_ai";
      const otherError =
        (review.error && review.error !== "no_ai" ? review.error : null) ||
        (coupons.error && coupons.error !== "no_ai" ? coupons.error : null);

      const verdicts: Record<string, ReviewVerdict> = {};
      for (const v of review.verdicts || []) verdicts[v.productId] = v;
      const deals: Record<string, CouponDeal> = {};
      for (const d of coupons.deals || []) deals[d.productId] = d;

      setAi({
        loading: false,
        error: otherError,
        noAi,
        free: Boolean(review.free || coupons.free),
        verdicts,
        deals,
      });
    } catch {
      setAi({
        loading: false,
        error: t("common.error"),
        noAi: false,
        free: false,
        verdicts: {},
        deals: {},
      });
    }
  }

  function checkout() {
    for (const p of cart.items) {
      if (p.proxyUrl) window.open(p.proxyUrl, "_blank", "noopener,noreferrer");
    }
  }

  const missingLinks = cart.ready
    ? cart.items.filter((p) => !p.proxyUrl).length
    : 0;

  if (!features.cart) return <Paywall title={t("pay.featureCart")} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">
          {t("cart.title")}
          {cart.ready && cart.items.length > 0 && (
            <span className="text-ink-muted font-normal"> ({cart.items.length})</span>
          )}
        </h1>
        {cart.ready && cart.items.length > 0 && (
          <button
            onClick={() => {
              cart.clear();
              toast(t("common.clear"), "info");
            }}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {t("common.clear")}
          </button>
        )}
      </div>

      {!cart.ready ? (
        <p className="text-ink-muted">{t("common.loading")}</p>
      ) : cart.items.length === 0 ? (
        <EmptyState
          icon="🛒"
          message={t("cart.empty")}
          ctaHref="/dashboard/link-generator"
          ctaLabel={t("nav.linkGenerator")}
        />
      ) : (
        <>
          {ai?.noAi && (
            <div className="card border border-amber-200 bg-amber-50 text-amber-900 text-sm">
              No AI provider is configured, so a free built-in overview is used.{" "}
              <Link href="/dashboard/settings" className="text-brand underline">
                Add your own AI key in Settings
              </Link>{" "}
              for richer safety checks and deal hunting.
            </div>
          )}
          {ai?.error && !ai.noAi && (
            <div className="card border border-red-200 bg-red-50 text-red-700 text-sm">
              {t("common.error")}
            </div>
          )}
          {ai && ai.free && !ai.noAi && (
            <p className="text-xs text-ink-muted">
              Using the free built-in overview.{" "}
              <Link href="/dashboard/settings" className="text-brand underline">
                Add an AI key
              </Link>{" "}
              for deeper analysis.
            </p>
          )}

          {missingLinks > 0 && (
            <p className="text-sm text-ink-muted">
              {missingLinks} item(s) don&apos;t have a generated affiliate link yet and
              won&apos;t open at checkout.{" "}
              <Link href="/dashboard/link-generator" className="text-brand underline">
                {t("nav.linkGenerator")}
              </Link>
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {cart.items.map((p) => (
              <CartRow
                key={p.productId}
                product={p}
                onRemove={() => {
                  cart.remove(p.productId);
                  toast(t("common.remove"), "info");
                }}
                verdict={ai?.verdicts[p.productId]}
                deal={ai?.deals[p.productId]}
              />
            ))}
          </ul>

          {/* Sticky action bar — always reachable while scrolling */}
          <div className="sticky bottom-20 md:bottom-4 z-30">
            <div className="card shadow-lg flex flex-wrap items-center gap-3">
              <span className="text-sm text-ink-muted">
                {cart.items.length} / {cart.max}
              </span>
              <div className="flex-1" />
              <button
                onClick={runAiCheck}
                disabled={ai?.loading}
                className="btn-primary inline-flex items-center gap-2"
              >
                {ai?.loading && <span className="spinner" />}
                {ai?.loading ? t("common.loading") : t("cart.aiCheck")}
              </button>
              <button
                onClick={checkout}
                className="rounded-full px-5 py-2 font-medium border border-line bg-surface text-ink hover:bg-surface-2"
              >
                {t("common.proceed")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CartRow({
  product,
  onRemove,
  verdict,
  deal,
}: {
  product: LocalProduct;
  onRemove: () => void;
  verdict?: ReviewVerdict;
  deal?: CouponDeal;
}) {
  return (
    <li className="card flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="w-20 h-20 shrink-0 rounded-card overflow-hidden bg-surface-2">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title || product.productId}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
              no image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-sm text-ink line-clamp-2">
            {product.title || product.productId}
          </p>
          <span className="text-price font-bold">
            {product.currency} {product.salePrice || "—"}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="self-start text-sm text-ink-muted hover:text-brand"
        >
          Remove
        </button>
      </div>

      {(verdict || deal) && (
        <div className="border-t border-line pt-3 flex flex-col gap-3">
          {verdict && (
            <div className="flex flex-col gap-1">
              <span
                className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${VERDICT_STYLES[verdict.verdict]}`}
              >
                {verdict.verdict}
              </span>
              {verdict.reasons.length > 0 && (
                <ul className="list-disc ms-5 text-xs text-ink-muted">
                  {verdict.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {deal && (
            <div className="flex flex-col gap-1 text-xs">
              {deal.bestPrice && (
                <p className="text-ink">
                  Best price:{" "}
                  <span className="text-price font-bold">{deal.bestPrice}</span>
                </p>
              )}
              {deal.coupons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-ink-muted">Coupons:</span>
                  {deal.coupons.map((c, i) => (
                    <code
                      key={i}
                      className="bg-surface-2 border border-line rounded px-1.5 py-0.5 text-ink"
                    >
                      {c}
                    </code>
                  ))}
                </div>
              )}
              {deal.tips.length > 0 && (
                <ul className="list-disc ms-5 text-ink-muted">
                  {deal.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
