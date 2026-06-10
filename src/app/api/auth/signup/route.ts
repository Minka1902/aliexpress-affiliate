import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { signupSchema } from "@/lib/validation";
import { notifyAdminOfSignup } from "@/lib/mailer";
import { defaultTrackingId } from "@/lib/config";
import { toPublicUser } from "@/dto/user";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "exists" }, { status: 409 });
  }

  const isAdmin = normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase();
  const passwordHash = await hashPassword(password);

  // No approval needed: new users are ACTIVE, role USER, and get the default tracking id.
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: isAdmin ? "ADMIN" : "USER",
      status: "ACTIVE",
      trackingId: isAdmin ? null : await defaultTrackingId(),
    },
  });

  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.status = user.status;
  await session.save();

  if (!isAdmin) {
    await notifyAdminOfSignup(user.email, user.name ?? user.email);
  }

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
