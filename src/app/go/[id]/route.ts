import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public redirect proxy. Hides the tracking id: users/buyers see /go/<id> and are 302'd to
// the real affiliate URL stored server-side. This is what makes shared links safe to expose.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const link = await prisma.generatedLink.findUnique({ where: { id } });
  if (!link || !link.affiliateUrl) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.redirect(link.affiliateUrl, 302);
}
