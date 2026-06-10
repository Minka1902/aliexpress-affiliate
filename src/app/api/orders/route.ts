import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { listOrders } from "@/lib/aliexpress/methods";
import { toUserOrder } from "@/dto/order";

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function GET() {
  const user = await getApiUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!user.trackingId) {
    return NextResponse.json({ orders: [], summary: null });
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 180);

  try {
    const { orders } = await listOrders({ startTime: fmt(start), endTime: fmt(end), pageSize: 50 });
    const userOrders = orders.map(toUserOrder); // commission stripped

    // Build a small analytics summary (GMV, counts, categories, statuses) — no commission.
    const gmv = userOrders.reduce((sum, o) => sum + (parseFloat(o.orderValue || "0") || 0), 0);
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const o of userOrders) {
      if (o.status) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.category) byCategory[o.category] = (byCategory[o.category] || 0) + 1;
    }

    return NextResponse.json({
      orders: userOrders,
      summary: {
        gmv: gmv.toFixed(2),
        currency: process.env.DEFAULT_CURRENCY || "USD",
        count: userOrders.length,
        byStatus,
        byCategory,
      },
    });
  } catch {
    return NextResponse.json({ orders: [], summary: null, error: "fetch_failed" });
  }
}
