import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";
import { encryptSecret } from "@/lib/crypto";
import { toPublicUser } from "@/dto/user";

export async function PATCH(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Record<string, unknown> = {};
  const { theme, locale, shipToCountry, aiProvider, aiKey, onboarded } = parsed.data;
  if (theme !== undefined) data.theme = theme;
  if (locale !== undefined) data.locale = locale;
  if (shipToCountry !== undefined) data.shipToCountry = shipToCountry.toUpperCase();
  if (aiProvider !== undefined) data.aiProvider = aiProvider;
  if (aiKey !== undefined) {
    // empty string / null clears the key
    data.aiKeyEncrypted = aiKey ? encryptSecret(aiKey) : null;
  }
  if (onboarded === true) data.onboardedAt = new Date();

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  const res = NextResponse.json({ user: toPublicUser(updated) });
  // Mirror theme/locale into cookies so SSR can pick them up immediately.
  if (theme !== undefined) res.cookies.set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  if (locale !== undefined) res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
