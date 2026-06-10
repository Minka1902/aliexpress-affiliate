import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { paySchema } from "@/lib/validation";
import { unlock } from "@/lib/payments";
import { toPublicUser } from "@/dto/user";

// Simulated checkout — unlocks instantly. (Stripe would redirect to Checkout instead.)
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await unlock(user.id, parsed.data.target);
  return NextResponse.json({ user: toPublicUser(updated) });
}
