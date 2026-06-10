import { NextRequest, NextResponse } from "next/server";
import { getApiUser, hasFeature } from "@/lib/auth";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { aiCheckSchema } from "@/lib/validation";
import { decryptSecret } from "@/lib/crypto";
import { resolveAi, runAi, extractJson } from "@/lib/ai/providers";
import { getPromotionInfo } from "@/lib/aliexpress/methods";

interface Deal {
  productId: string;
  bestPrice?: string;
  coupons: string[];
  tips: string[];
}

// AI coupon/deal hunter. Combines AliExpress promo data with the AI's reasoning to surface
// best price + coupon/promo suggestions for each cart item.
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasFeature(user, "ai")) {
    return NextResponse.json({ error: "locked", feature: "ai" }, { status: 403 });
  }

  const rl = rateLimit(`ai:${user.id}`, LIMITS.ai);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = aiCheckSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const decrypted = user.aiKeyEncrypted ? safeDecrypt(user.aiKeyEncrypted) : null;
  const ai = resolveAi(user.aiProvider, decrypted);
  if (!ai) {
    return NextResponse.json({ error: "no_ai", message: "No AI provider configured." }, { status: 400 });
  }

  const enriched = await Promise.all(
    parsed.data.products.map(async (p) => {
      let info: Record<string, unknown> | null = null;
      try {
        info = await getPromotionInfo(p.productId, user.shipToCountry ?? undefined);
      } catch {
        info = null;
      }
      return {
        productId: p.productId,
        title: p.title || (info?.product_title as string) || "",
        salePrice: (info?.target_sale_price as string) || (info?.sale_price as string) || "",
        originalPrice: (info?.target_original_price as string) || "",
        discount: (info?.discount as string) || "",
        promoData: info ? pickPromo(info) : null,
      };
    })
  );

  const system =
    "You are a savvy AliExpress deal finder. Using the official promotion data provided and " +
    "your knowledge of common AliExpress coupon mechanics (store coupons, select coupons, " +
    "seller coupons, bundle discounts), suggest how the buyer can get the best price. Be " +
    "concise and practical. Respond ONLY with JSON of shape " +
    '{"deals":[{"productId":"...","bestPrice":"...","coupons":["..."],"tips":["..."]}]}.';

  const prompt = "Find the best deals for these products:\n" + JSON.stringify(enriched, null, 2);

  try {
    const text = await runAi(ai, system, prompt);
    const json = extractJson<{ deals: Deal[] }>(text);
    return NextResponse.json({ free: ai.free, deals: json?.deals ?? [], raw: json ? undefined : text });
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }
}

function pickPromo(info: Record<string, unknown>) {
  return {
    commission_rate: info.commission_rate,
    coupon: info.coupon_price ?? info.coupon_amount,
    promo: info.promotion_link ? "available" : undefined,
  };
}

function safeDecrypt(payload: string): string | null {
  try {
    return decryptSecret(payload);
  } catch {
    return null;
  }
}
