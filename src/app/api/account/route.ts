import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Self-service account deletion. The configured admin cannot delete themselves.
export async function DELETE() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.email === process.env.ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ error: "cannot_delete_admin" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id: user.id } });
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
