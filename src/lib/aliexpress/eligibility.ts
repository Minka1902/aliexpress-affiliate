import { parseAliExpressUrl } from "./parse-url";
import { generateAffiliateLinks, smartMatch, getPromotionInfo, getShipping } from "./methods";
import type { AeProduct } from "./types";

export interface ResolvedLink {
  sourceUrl: string;
  normalizedUrl: string;
  productId: string | null;
  eligible: boolean;
  affiliateUrl: string | null; // RAW tracked URL — server-only; never returned to client directly
  product: Partial<AeProduct> | null;
  similar: AeProduct[]; // eligible alternatives when not eligible
  error?: string;
}

/**
 * Resolves a pasted AliExpress URL: parses it, attempts to generate an affiliate link
 * (success == eligible), and on failure finds similar eligible products via smartmatch.
 */
export async function resolveLink(
  sourceUrl: string,
  trackingId: string,
  shipToCountry?: string
): Promise<ResolvedLink> {
  const parsed = await parseAliExpressUrl(sourceUrl);
  const base: ResolvedLink = {
    sourceUrl,
    normalizedUrl: parsed.normalizedUrl,
    productId: parsed.productId,
    eligible: false,
    affiliateUrl: null,
    product: null,
    similar: [],
    error: parsed.error,
  };

  if (parsed.error && !parsed.productId) {
    // Could not even parse — still try generating against the normalized URL.
  }

  // Attempt affiliate-link generation (eligibility gate) AND product enrichment in parallel.
  // They both only need the parsed URL/productId, so there's no reason to serialize them.
  const [linkResult, promoResult, shipResult] = await Promise.allSettled([
    generateAffiliateLinks([parsed.normalizedUrl], trackingId, shipToCountry),
    parsed.productId ? getPromotionInfo(parsed.productId, shipToCountry) : Promise.resolve(null),
    parsed.productId ? getShipping({ productId: parsed.productId, shipToCountry }) : Promise.resolve(null),
  ]);
  const shipping = shipResult.status === "fulfilled" ? shipResult.value : null;

  let affiliateUrl: string | null = null;
  if (linkResult.status === "fulfilled") {
    const map = linkResult.value;
    affiliateUrl = map.get(parsed.normalizedUrl) ?? [...map.values()][0] ?? null;
  }

  if (affiliateUrl) {
    base.eligible = true;
    base.affiliateUrl = affiliateUrl;
    base.error = undefined;
    if (parsed.productId) {
      const promo = promoResult.status === "fulfilled" ? promoResult.value : null;
      base.product = {
        productId: parsed.productId,
        title: (promo?.product_title as string) || undefined,
        imageUrl: (promo?.product_main_image_url as string) || undefined,
        salePrice: (promo?.target_sale_price as string) || (promo?.sale_price as string) || undefined,
        estimatedDeliveryDays: shipping?.estimatedDeliveryDays,
        shippingFee: shipping?.shippingFee,
        freeShipping: shipping?.freeShipping,
      };
    }
    return base;
  }

  // Not eligible → find similar eligible products.
  if (parsed.productId) {
    try {
      const similar = await smartMatch({ productId: parsed.productId, trackingId });
      base.similar = similar.filter((p) => p.promotionUrl).slice(0, 12);
    } catch {
      base.similar = [];
    }
  }
  base.error = base.error || "This product is not eligible for the affiliate program.";
  return base;
}
