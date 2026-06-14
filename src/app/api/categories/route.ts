import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { getCategories } from "@/lib/aliexpress/methods";
import { cached } from "@/lib/cache";

export async function GET() {
  const user = await getApiUser();
  if (!user || user.status === "BANNED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const categories = await cached("categories", 24 * 60 * 60_000, getCategories);
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
