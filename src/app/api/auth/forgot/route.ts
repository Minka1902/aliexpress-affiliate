import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotSchema } from "@/lib/validation";
import { createToken } from "@/lib/tokens";
import { sendPasswordReset } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  // Always respond ok (no user enumeration).
  if (!parsed.success) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user) {
    const raw = await createToken(user.id, "RESET");
    const link = `${req.nextUrl.origin}/reset?token=${raw}`;
    await sendPasswordReset(user.email, link);
  }
  return NextResponse.json({ ok: true });
}
