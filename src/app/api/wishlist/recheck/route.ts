import { NextRequest, NextResponse } from "next/server";
import { getApiUser, hasFeature } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { wishlistRecheckSchema } from "@/lib/validation";
import { resolveLink } from "@/lib/aliexpress/eligibility";

// Re-checks each wishlist item's eligibility (called on login). For now-eligible items it
// returns a hidden proxy link; for still-ineligible items it returns a similar eligible one.
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status === "BANNED" || !user.trackingId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasFeature(user, "wishlist")) {
    return NextResponse.json({ error: "locked", feature: "wishlist" }, { status: 403 });
  }

  const rl = rateLimit(`recheck:${user.id}`, LIMITS.wishlistRecheck);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = wishlistRecheckSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const origin = req.nextUrl.origin;
  const results = [];

  for (const productId of parsed.data.productIds) {
    const url = `https://www.aliexpress.com/item/${productId}.html`;
    const resolved = await resolveLink(url, user.trackingId, user.shipToCountry ?? undefined);

    if (resolved.eligible && resolved.affiliateUrl) {
      const saved = await prisma.generatedLink.create({
        data: {
          userId: user.id,
          sourceUrl: url,
          productId,
          affiliateUrl: resolved.affiliateUrl,
          eligible: true,
          title: resolved.product?.title ?? null,
          imageUrl: resolved.product?.imageUrl ?? null,
        },
      });
      results.push({
        productId,
        nowEligible: true,
        proxyUrl: `${origin}/go/${saved.id}`,
        product: resolved.product,
      });
    } else {
      const suggestion = resolved.similar[0];
      results.push({
        productId,
        nowEligible: false,
        suggestion: suggestion
          ? {
              productId: suggestion.productId,
              title: suggestion.title,
              imageUrl: suggestion.imageUrl,
              salePrice: suggestion.salePrice,
              currency: suggestion.currency,
              sourceUrl: `https://www.aliexpress.com/item/${suggestion.productId}.html`,
            }
          : null,
      });
    }
  }

  return NextResponse.json({ results });
}
