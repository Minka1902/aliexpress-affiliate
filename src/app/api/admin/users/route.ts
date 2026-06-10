import { NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toAdminUser } from "@/dto/user";

export async function GET() {
  const user = await getApiUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ users: users.map(toAdminUser) });
}
