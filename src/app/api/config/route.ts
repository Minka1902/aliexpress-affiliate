import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { getConfig } from "@/lib/config";

// Public-ish pricing for the pay page (no secrets). Requires an active session.
export async function GET() {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cfg = await getConfig();
  return NextResponse.json({
    prices: {
      ai: cfg.priceAi,
      cart: cfg.priceCart,
      wishlist: cfg.priceWishlist,
      bundle: cfg.priceBundle,
    },
    bundleEnabled: cfg.bundleEnabled,
    currency: cfg.currency,
  });
}
