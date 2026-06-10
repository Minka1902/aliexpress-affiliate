import type { OrderSummary } from "@/lib/aliexpress/types";

// User-facing order shape. Deliberately omits ALL commission/earnings fields.
export interface UserOrder {
  orderId: string;
  status?: string;
  productTitle?: string;
  productId?: string;
  orderValue?: string; // GMV (what the buyer paid) — allowed for users
  currency?: string;
  createdAt?: string;
  paidTime?: string;
  category?: string;
  estimatedDeliveryDays?: number;
}

export function toUserOrder(o: OrderSummary): UserOrder {
  // OrderSummary already excludes commission; this makes the guarantee explicit & typed.
  const { orderId, status, productTitle, productId, orderValue, currency, createdAt, paidTime, category, estimatedDeliveryDays } = o;
  return { orderId, status, productTitle, productId, orderValue, currency, createdAt, paidTime, category, estimatedDeliveryDays };
}
