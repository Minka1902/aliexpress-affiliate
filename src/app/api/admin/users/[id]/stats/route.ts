import { NextRequest, NextResponse } from "next/server";
import { getApiUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listOrders } from "@/lib/aliexpress/methods";

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Admin-only per-user statistics, including commissions (which are NEVER shown to the user).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getApiUser();
  if (!isAdminUser(admin)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const linkCount = await prisma.generatedLink.count({ where: { userId: id } });

  let orderCount = 0;
  let gmv = 0;
  let commission = 0;
  let currency = process.env.DEFAULT_CURRENCY || "USD";

  if (target.trackingId) {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 180);
      const { orders, rawCommission } = await listOrders({
        startTime: fmt(start),
        endTime: fmt(end),
        pageSize: 50,
      });
      orderCount = orders.length;
      for (const o of orders) {
        gmv += parseFloat(o.orderValue || "0") || 0;
        if (o.currency) currency = o.currency;
        commission += parseFloat(rawCommission[o.orderId] || "0") || 0;
      }
    } catch {
      /* live data unavailable (e.g. sandbox) — return zeros */
    }
  }

  return NextResponse.json({
    stats: {
      linkCount,
      orderCount,
      gmv: gmv.toFixed(2),
      commission: commission.toFixed(2), // admin-only
      currency,
    },
  });
}
