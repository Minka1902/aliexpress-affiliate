import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetSchema } from "@/lib/validation";
import { consumeToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = await consumeToken(parsed.data.token, "RESET");
  if (!userId) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return NextResponse.json({ ok: true });
}
