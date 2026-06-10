import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { toPublicUser } from "@/dto/user";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: toPublicUser(user) });
}
