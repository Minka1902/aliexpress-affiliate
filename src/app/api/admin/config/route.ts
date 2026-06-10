import { NextRequest, NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { adminConfigSchema } from "@/lib/validation";

export async function GET() {
  const user = await getApiUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ config: await getConfig() });
}

export async function PATCH(req: NextRequest) {
  const user = await getApiUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = adminConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await getConfig(); // ensure row exists
  const updated = await prisma.appConfig.update({ where: { id: 1 }, data: parsed.data });
  return NextResponse.json({ config: updated });
}
