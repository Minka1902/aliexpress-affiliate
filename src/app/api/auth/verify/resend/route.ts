import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { createToken } from "@/lib/tokens";
import { sendVerifyEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true });

  const raw = await createToken(user.id, "VERIFY", 24 * 60 * 60_000);
  await sendVerifyEmail(user.email, `${req.nextUrl.origin}/api/auth/verify?token=${raw}`);
  return NextResponse.json({ ok: true });
}
