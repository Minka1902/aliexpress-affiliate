import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { signinSchema } from "@/lib/validation";
import { toPublicUser } from "@/dto/user";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // Generic error to avoid user enumeration.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.status = user.status;
  await session.save();

  return NextResponse.json({ user: toPublicUser(user) });
}
