import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { signupSchema } from "@/lib/validation";
import { notifyAdminOfSignup } from "@/lib/mailer";
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

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: isAdmin ? "ADMIN" : "USER",
      status: isAdmin ? "APPROVED" : "PENDING",
    },
  });

  // Establish a session immediately; status gating handles access.
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
