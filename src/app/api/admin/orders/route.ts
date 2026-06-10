import { NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { listOrders } from "@/lib/aliexpress/methods";

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Admin-only: ALL affiliate orders + commissions across the whole account.
export async function GET() {
  const user = await getApiUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 180);
    const { orders, rawCommission } = await listOrders({
      startTime: fmt(start),
      endTime: fmt(end),
      pageSize: 50,
    });
    const withCommission = orders.map((o) => ({
      ...o,
      commission: rawCommission[o.orderId] ?? null, // admin-only field
    }));
    const totalGmv = orders.reduce((s, o) => s + (parseFloat(o.orderValue || "0") || 0), 0);
    const totalCommission = orders.reduce(
      (s, o) => s + (parseFloat(rawCommission[o.orderId] || "0") || 0),
      0
    );
    return NextResponse.json({
      orders: withCommission,
      summary: {
        count: orders.length,
        gmv: totalGmv.toFixed(2),
        commission: totalCommission.toFixed(2),
        currency: process.env.DEFAULT_CURRENCY || "USD",
      },
    });
  } catch {
    return NextResponse.json({ orders: [], summary: null, error: "fetch_failed" });
  }
}
