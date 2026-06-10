import { NextRequest, NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUserEditSchema } from "@/lib/validation";
import { toAdminUser } from "@/dto/user";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getApiUser();
  if (!isAdminUser(admin)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = adminUserEditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Guard against locking yourself out / demoting the configured admin.
  if (target.email === process.env.ADMIN_EMAIL && parsed.data.role && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "cannot_demote_admin" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const k of [
    "name",
    "email",
    "role",
    "trackingId",
    "status",
    "unlockedAi",
    "unlockedCart",
    "unlockedWishlist",
  ] as const) {
    if (parsed.data[k] !== undefined) {
      data[k] = k === "email" ? String(parsed.data[k]).toLowerCase() : parsed.data[k];
    }
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ user: toAdminUser(updated) });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getApiUser();
  if (!isAdminUser(admin)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (target.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "cannot_delete_admin" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
