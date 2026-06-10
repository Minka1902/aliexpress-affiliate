"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { useLocalList, type LocalProduct } from "@/hooks/useLocalList";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

const BRAND = "rgb(230,46,4)";
const PIE_PALETTE = [
  "rgb(230,46,4)",
  "rgb(255,146,43)",
  "rgb(255,196,0)",
  "rgb(46,160,67)",
  "rgb(31,111,235)",
  "rgb(130,80,223)",
];

interface Order {
  orderId: string;
  status?: string;
  productTitle?: string;
  productId?: string;
  orderValue?: string;
  currency?: string;
  createdAt?: string;
  paidTime?: string;
  category?: string;
  estimatedDeliveryDays?: number;
}

interface OrdersSummary {
  gmv: string;
  currency: string;
  count: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

interface OrdersResponse {
  orders: Order[];
  summary: OrdersSummary | null;
}

interface RecommendationsResponse {
  products: ProductCardData[];
}

export default function Dashboard() {
  const t = useTranslations();
  const { toast } = useToast();
  const cart = useLocalList("cart");
  const wishlist = useLocalList("wishlist");

  function addToCart(p: Omit<LocalProduct, "addedAt">) {
    const r = cart.add(p);
    if (r.ok) toast(t("toast.addedToCart"));
    else if (r.reason === "full") toast(t("toast.cartFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
  }

  function addToWishlist(p: Omit<LocalProduct, "addedAt">) {
    const r = wishlist.add(p);
    if (r.ok) toast(t("toast.addedToWishlist"));
    else if (r.reason === "full") toast(t("toast.wishlistFull"), "error");
    else toast(t("toast.alreadyAdded"), "info");
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ordersRes, recsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/recommendations"),
        ]);
        if (!ordersRes.ok || !recsRes.ok) throw new Error("request failed");
        const ordersData = (await ordersRes.json()) as OrdersResponse;
        const recsData = (await recsRes.json()) as RecommendationsResponse;
        if (!active) return;
        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setSummary(ordersData.summary ?? null);
        setProducts(Array.isArray(recsData.products) ? recsData.products : []);
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

  const avgShipping = useMemo(() => {
    const days = orders
      .map((o) => o.estimatedDeliveryDays)
      .filter((d): d is number => typeof d === "number" && !Number.isNaN(d));
    if (days.length === 0) return null;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }, [orders]);

  const categoryData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [summary]);

  const statusData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.byStatus).map(([name, value]) => ({ name, value }));
  }, [summary]);

  const overTimeData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const o of orders) {
      if (!o.createdAt) continue;
      const date = o.createdAt.slice(0, 10);
      if (!date) continue;
      buckets[date] = (buckets[date] ?? 0) + parseFloat(o.orderValue || "0");
    }
    return Object.entries(buckets)
      .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-ink">{t("dashboard.title")}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card h-20 skeleton" />
          <div className="card h-20 skeleton" />
          <div className="card h-20 skeleton" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-ink-muted">{t("common.error")}</div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{t("dashboard.title")}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-ink-muted">{t("dashboard.gmv")}</p>
          <p className="text-2xl font-bold text-price mt-1">
            {summary ? `${summary.currency} ${summary.gmv}` : "—"}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-muted">{t("dashboard.orders")}</p>
          <p className="text-2xl font-bold text-ink mt-1">{summary ? summary.count : 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-muted">{t("dashboard.avgShipping")}</p>
          <p className="text-2xl font-bold text-ink mt-1">
            {avgShipping === null ? "—" : avgShipping}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-ink mb-3">{t("dashboard.byCategory")}</h2>
          {categoryData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-ink-muted text-sm">
              —
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-ink mb-3">{t("dashboard.byStatus")}</h2>
          {statusData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-ink-muted text-sm">
              —
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink mb-3">{t("dashboard.overTime")}</h2>
          {overTimeData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-ink-muted text-sm">
              —
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={overTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={BRAND}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">{t("dashboard.recommendations")}</h2>
        {products.length === 0 ? (
          <div className="card text-center text-ink-muted text-sm py-8">—</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map((p) => (
              <ProductCard
                key={p.productId}
                product={p}
                actionLabel={t("link.addToCart")}
                onAction={(prod) =>
                  addToCart({
                    productId: prod.productId,
                    title: prod.title,
                    imageUrl: prod.imageUrl,
                    salePrice: prod.salePrice,
                    currency: prod.currency,
                    sourceUrl: prod.sourceUrl,
                  })
                }
                onWishlist={(prod) =>
                  addToWishlist({
                    productId: prod.productId,
                    title: prod.title,
                    imageUrl: prod.imageUrl,
                    salePrice: prod.salePrice,
                    currency: prod.currency,
                    sourceUrl: prod.sourceUrl,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
