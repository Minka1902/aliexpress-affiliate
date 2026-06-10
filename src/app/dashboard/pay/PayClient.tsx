"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/Toast";
import { useEntitlements } from "@/components/EntitlementsProvider";

interface Prices {
  ai: number;
  cart: number;
  wishlist: number;
  bundle: number;
}
interface ConfigResp {
  prices: Prices;
  bundleEnabled: boolean;
  currency: string;
}

type Target = "ai" | "cart" | "wishlist" | "bundle";

export function PayClient() {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const features = useEntitlements();
  const [cfg, setCfg] = useState<ConfigResp | null>(null);
  const [busy, setBusy] = useState<Target | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setCfg(d))
      .catch(() => {});
  }, []);

  function money(minor: number, currency: string) {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }

  async function unlock(target: Target) {
    setBusy(target);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    setBusy(null);
    if (res.ok) {
      toast(t("pay.unlocked"));
      router.refresh();
    } else {
      toast(t("common.error"), "error");
    }
  }

  if (!cfg) return <div className="skeleton h-48 rounded-card" />;

  const owned: Record<Target, boolean> = {
    ai: features.ai,
    cart: features.cart,
    wishlist: features.wishlist,
    bundle: features.ai && features.cart && features.wishlist,
  };

  const items: { key: Target; label: string; price: number }[] = [
    { key: "ai", label: t("pay.featureAi"), price: cfg.prices.ai },
    { key: "cart", label: t("pay.featureCart"), price: cfg.prices.cart },
    { key: "wishlist", label: t("pay.featureWishlist"), price: cfg.prices.wishlist },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("pay.title")}</h1>
        <p className="text-ink-muted">{t("pay.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.key} className="card flex flex-col gap-3">
            <h2 className="font-semibold text-ink">{it.label}</h2>
            <p className="text-2xl font-bold text-price">{money(it.price, cfg.currency)}</p>
            <button
              disabled={owned[it.key] || busy === it.key}
              onClick={() => unlock(it.key)}
              className="btn-primary mt-auto disabled:opacity-60"
            >
              {owned[it.key] ? `✓ ${t("pay.owned")}` : busy === it.key ? "…" : t("pay.unlock")}
            </button>
          </div>
        ))}
      </div>

      {cfg.bundleEnabled && (
        <div className="card border-2 border-brand flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full">{t("pay.bestValue")}</span>
            <h2 className="font-semibold text-ink mt-1">{t("pay.bundle")}</h2>
          </div>
          <p className="text-2xl font-bold text-price">{money(cfg.prices.bundle, cfg.currency)}</p>
          <button
            disabled={owned.bundle || busy === "bundle"}
            onClick={() => unlock("bundle")}
            className="btn-primary disabled:opacity-60"
          >
            {owned.bundle ? `✓ ${t("pay.owned")}` : busy === "bundle" ? "…" : t("pay.unlock")}
          </button>
        </div>
      )}
    </div>
  );
}
