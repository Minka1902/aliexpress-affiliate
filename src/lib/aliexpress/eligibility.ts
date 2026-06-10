import { parseAliExpressUrl } from "./parse-url";
import { generateAffiliateLinks, smartMatch, getPromotionInfo } from "./methods";
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

  // Attempt affiliate-link generation (this is our eligibility gate).
  let affiliateUrl: string | null = null;
  try {
    const map = await generateAffiliateLinks([parsed.normalizedUrl], trackingId, shipToCountry);
    affiliateUrl = map.get(parsed.normalizedUrl) ?? [...map.values()][0] ?? null;
  } catch {
    affiliateUrl = null;
  }

  if (affiliateUrl) {
    base.eligible = true;
    base.affiliateUrl = affiliateUrl;
    base.error = undefined;
    // Best-effort enrichment for the product card.
    if (parsed.productId) {
      try {
        const promo = await getPromotionInfo(parsed.productId, shipToCountry);
        if (promo) {
          base.product = {
            productId: parsed.productId,
            title: (promo.product_title as string) || undefined,
            imageUrl: (promo.product_main_image_url as string) || undefined,
            salePrice: (promo.target_sale_price as string) || (promo.sale_price as string) || undefined,
          };
        }
      } catch {
        base.product = { productId: parsed.productId };
      }
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
