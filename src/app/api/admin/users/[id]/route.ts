import { NextRequest, NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUserActionSchema } from "@/lib/validation";
import { notifyUserApproved } from "@/lib/mailer";
import { toAdminUser } from "@/dto/user";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getApiUser();
  if (!isAdminUser(admin)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { action, trackingId } = parsed.data;

  if (action === "assignTracking") {
    if (!trackingId) return NextResponse.json({ error: "trackingId required" }, { status: 400 });
    const updated = await prisma.user.update({ where: { id }, data: { trackingId } });
    return NextResponse.json({ user: toAdminUser(updated) });
  }

  if (action === "reject") {
    const updated = await prisma.user.update({ where: { id }, data: { status: "REJECTED" } });
    return NextResponse.json({ user: toAdminUser(updated) });
  }

  if (action === "approve") {
    // Approval requires a tracking id (either already set or supplied now).
    const effectiveTracking = trackingId ?? target.trackingId;
    if (!effectiveTracking) {
      return NextResponse.json({ error: "needs_tracking" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { status: "APPROVED", trackingId: effectiveTracking },
    });
    await notifyUserApproved(updated.email, updated.name ?? updated.email);
    return NextResponse.json({ user: toAdminUser(updated) });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
