// Lightweight shapes for the bits of AliExpress responses we use. The API returns many
// more fields; we keep these permissive.

export interface AeProduct {
  productId: string;
  title: string;
  imageUrl?: string;
  salePrice?: string;
  originalPrice?: string;
  currency?: string;
  discount?: string;
  rating?: string;
  orders?: number;
  promotionUrl?: string; // tracked affiliate link, when available
  categoryId?: string;
  shopUrl?: string;
}

export interface AffiliateLinkResult {
  sourceUrl: string;
  affiliateUrl: string | null;
  eligible: boolean;
}

export interface OrderSummary {
  orderId: string;
  status?: string;
  productTitle?: string;
  productId?: string;
  orderValue?: string; // GMV — what the buyer paid (NOT commission)
  currency?: string;
  createdAt?: string;
  paidTime?: string;
  category?: string;
  estimatedDeliveryDays?: number;
}

export interface ShippingInfo {
  productId: string;
  estimatedDeliveryDays?: number;
  shippingFee?: string;
  currency?: string;
  serviceName?: string;
}
