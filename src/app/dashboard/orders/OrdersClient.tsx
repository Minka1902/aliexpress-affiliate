"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";

interface Order {
  orderId: string;
  status?: string;
  productTitle?: string;
  productId?: string;
  orderValue?: number;
  currency?: string;
  createdAt?: string;
  paidTime?: string;
  category?: string;
  estimatedDeliveryDays?: number;
}

interface OrdersSummary {
  gmv?: number;
  count?: number;
  currency?: string;
}

interface OrdersResponse {
  orders: Order[];
  summary: OrdersSummary | null;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatMoney(value?: number, currency?: string): string {
  if (value === undefined || value === null) return "—";
  return `${currency ? currency + " " : ""}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function OrdersClient() {
  const t = useTranslations();
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("failed");
        const json: OrdersResponse = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-ink">{t("nav.orders")}</h1>
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-ink-muted">{t("common.error")}</p>;
  }

  const orders = data.orders ?? [];
  const summary = data.summary;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-ink">{t("nav.orders")}</h1>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="card">
          <p className="text-xs text-ink-muted">{t("dashboard.gmv")}</p>
          <p className="text-xl font-semibold text-price mt-1">
            {formatMoney(summary?.gmv ?? 0, summary?.currency)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-ink-muted">{t("dashboard.orders")}</p>
          <p className="text-xl font-semibold text-ink mt-1">
            {summary?.count ?? orders.length}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="📦" message={`${t("dashboard.orders")} — 0`} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b border-line">
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Value</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Est. delivery days</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId} className="border-b border-line last:border-0">
                  <td className="py-2 pr-4 text-ink max-w-xs">
                    <span className="line-clamp-2">
                      {o.productTitle || o.productId || o.orderId}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">{o.status || "—"}</td>
                  <td className="py-2 pr-4 text-price whitespace-nowrap">
                    {formatMoney(o.orderValue, o.currency)}
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">{o.category || "—"}</td>
                  <td className="py-2 pr-4 text-ink-muted whitespace-nowrap">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {o.estimatedDeliveryDays ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
