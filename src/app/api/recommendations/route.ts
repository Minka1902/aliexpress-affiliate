import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { listOrders, smartMatch, getHotProducts, queryProducts } from "@/lib/aliexpress/methods";
import type { AeProduct } from "@/lib/aliexpress/types";

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const STOPWORDS = new Set(["the", "and", "for", "with", "pcs", "new", "set", "of", "to", "in", "a"]);

function keywordsFromTitles(titles: string[]): string {
  const freq = new Map<string, number>();
  for (const t of titles) {
    for (const w of t.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w)
    .join(" ");
}

export async function GET() {
  const user = await getApiUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!user.trackingId) return NextResponse.json({ products: [] });

  const rl = rateLimit(`rec:${user.id}`, LIMITS.recommendations);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const trackingId = user.trackingId;

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 180);
    const { orders } = await listOrders({ startTime: fmt(start), endTime: fmt(end), pageSize: 50 });

    let products: AeProduct[] = [];
    if (orders.length > 0) {
      const kw = keywordsFromTitles(orders.map((o) => o.productTitle || "").filter(Boolean));
      const lastProductId = orders.find((o) => o.productId)?.productId;
      if (lastProductId) {
        products = await smartMatch({ productId: lastProductId, trackingId });
      }
      if (products.length === 0 && kw) {
        products = await queryProducts({ keywords: kw, trackingId, pageSize: 20 });
      }
    }
    if (products.length === 0) {
      // Cold-start fallback.
      products = await getHotProducts({ trackingId, pageSize: 20 });
    }

    // Strip the raw tracked promotion link; expose plain item URLs instead.
    const sanitized = products.map((p) => ({
      productId: p.productId,
      title: p.title,
      imageUrl: p.imageUrl,
      salePrice: p.salePrice,
      originalPrice: p.originalPrice,
      currency: p.currency,
      discount: p.discount,
      rating: p.rating,
      orders: p.orders,
      sourceUrl: `https://www.aliexpress.com/item/${p.productId}.html`,
    }));

    return NextResponse.json({ products: sanitized });
  } catch {
    return NextResponse.json({ products: [], error: "fetch_failed" });
  }
}
