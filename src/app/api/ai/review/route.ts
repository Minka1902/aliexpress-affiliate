import { NextRequest, NextResponse } from "next/server";
import { getApiUser, hasFeature } from "@/lib/auth";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { aiCheckSchema } from "@/lib/validation";
import { decryptSecret } from "@/lib/crypto";
import { resolveAi, runAi, extractJson } from "@/lib/ai/providers";
import { getPromotionInfo } from "@/lib/aliexpress/methods";

interface Verdict {
  productId: string;
  verdict: "Safe" | "Caution" | "Avoid";
  reasons: string[];
}

// Pre-checkout rip-off screener: gathers available AliExpress data per product and asks the
// AI for a Safe/Caution/Avoid verdict. Runs for all cart items at once.
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

  // Enrich with whatever the affiliate API exposes (title, price, rating, store).
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
        rating: (info?.evaluate_rate as string) || "",
        orders: (info?.lastest_volume as string) || "",
        discount: (info?.discount as string) || "",
      };
    })
  );

  const system =
    "You are a careful shopping-safety assistant for AliExpress buyers. Assess rip-off risk " +
    "from the data provided (price vs market, discount plausibility, rating, order volume, " +
    "missing info). Be concise. Respond ONLY with JSON of shape " +
    '{"verdicts":[{"productId":"...","verdict":"Safe|Caution|Avoid","reasons":["..."]}]}.';

  const prompt =
    "Assess these products and return the JSON described:\n" + JSON.stringify(enriched, null, 2);

  try {
    const text = await runAi(ai, system, prompt);
    const json = extractJson<{ verdicts: Verdict[] }>(text);
    return NextResponse.json({
      free: ai.free,
      verdicts: json?.verdicts ?? [],
      raw: json ? undefined : text,
    });
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }
}

function safeDecrypt(payload: string): string | null {
  try {
    return decryptSecret(payload);
  } catch {
    return null;
  }
}
