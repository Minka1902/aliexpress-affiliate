import { NextRequest, NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toAdminUser } from "@/dto/user";

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const where = q
    ? {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ users: users.map(toAdminUser) });
}
