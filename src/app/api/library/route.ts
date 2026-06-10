import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const links = await prisma.generatedLink.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const origin = req.nextUrl.origin;
  return NextResponse.json({
    links: links.map((l) => ({
      id: l.id,
      sourceUrl: l.sourceUrl,
      productId: l.productId,
      eligible: l.eligible,
      title: l.title,
      imageUrl: l.imageUrl,
      tags: l.tags,
      note: l.note,
      proxyUrl: l.eligible && l.affiliateUrl ? `${origin}/go/${l.id}` : null,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
