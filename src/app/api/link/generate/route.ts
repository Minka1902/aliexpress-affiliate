import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLinkSchema } from "@/lib/validation";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { resolveLink } from "@/lib/aliexpress/eligibility";

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!user.trackingId) {
    return NextResponse.json({ error: "no_tracking_id" }, { status: 403 });
  }

  const rl = rateLimit(`link:${user.id}`, LIMITS.linkGenerate);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited", retryAfter: rl.retryAfter }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = generateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const results = [];

  for (const url of parsed.data.urls) {
    const resolved = await resolveLink(url, user.trackingId, user.shipToCountry ?? undefined);

    // Persist the generated link (also powers the library). Store the RAW affiliate URL
    // server-side; expose only a /go/<id> proxy so the tracking id stays hidden.
    const saved = await prisma.generatedLink.create({
      data: {
        userId: user.id,
        sourceUrl: resolved.sourceUrl,
        productId: resolved.productId,
        affiliateUrl: resolved.affiliateUrl,
        eligible: resolved.eligible,
        title: resolved.product?.title ?? null,
        imageUrl: resolved.product?.imageUrl ?? null,
      },
    });

    results.push({
      id: saved.id,
      sourceUrl: resolved.sourceUrl,
      productId: resolved.productId,
      eligible: resolved.eligible,
      // Proxy link — NEVER the raw affiliate URL (which embeds the tracking id).
      proxyUrl: resolved.eligible ? `${origin}/go/${saved.id}` : null,
      product: resolved.product,
      similar: resolved.similar.map((p) => ({
        productId: p.productId,
        title: p.title,
        imageUrl: p.imageUrl,
        salePrice: p.salePrice,
        originalPrice: p.originalPrice,
        currency: p.currency,
        discount: p.discount,
        rating: p.rating,
        orders: p.orders,
        // Construct a plain item URL; the raw tracked promotion link is NOT exposed.
        // Adding to cart / generating re-runs generate() to produce a hidden proxy link.
        sourceUrl: `https://www.aliexpress.com/item/${p.productId}.html`,
      })),
      error: resolved.error,
    });
  }

  return NextResponse.json({ results });
}
