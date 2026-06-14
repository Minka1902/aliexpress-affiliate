import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { queryProducts, getHotProducts } from "@/lib/aliexpress/methods";
import { cached } from "@/lib/cache";

// Keyword/category product search for the Browse page. Sanitized: never exposes the raw
// tracked promotion link — clients re-generate a hidden /go proxy via /api/link/generate.
export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!user.trackingId) return NextResponse.json({ products: [] });

  const rl = rateLimit(`products:${user.id}`, LIMITS.recommendations);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const category = req.nextUrl.searchParams.get("category")?.trim() || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const trackingId = user.trackingId;

  try {
    const products = await cached(`products:${trackingId}:${q}:${category}:${page}`, 5 * 60_000, () =>
      q
        ? queryProducts({ keywords: q, categoryIds: category || undefined, trackingId, pageNo: page, pageSize: 24 })
        : getHotProducts({ trackingId, categoryIds: category || undefined, pageNo: page, pageSize: 24 })
    );

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
