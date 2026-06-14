import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/tokens";

// Email verification link target. Sets emailVerifiedAt then redirects to the dashboard.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const userId = await consumeToken(token, "VERIFY");
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    return NextResponse.redirect(new URL("/dashboard?verified=1", req.nextUrl.origin));
  }
  return NextResponse.redirect(new URL("/dashboard?verified=0", req.nextUrl.origin));
}
