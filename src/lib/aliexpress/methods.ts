import { callApi, unwrapResult } from "./client";
import type { AeProduct, OrderSummary, ShippingInfo } from "./types";

const COUNTRY = () => process.env.DEFAULT_SHIP_COUNTRY || "US";
const CURRENCY = () => process.env.DEFAULT_CURRENCY || "USD";

const PRODUCT_FIELDS =
  "product_id,product_title,product_main_image_url,target_sale_price,target_original_price,sale_price,original_price,discount,evaluate_rate,lastest_volume,promotion_link,first_level_category_id,second_level_category_id,shop_url";

/** AliExpress wraps lists as { wrapper: { item: [...] } } — normalize to an array. */
function asArray(node: unknown, itemKey: string): Record<string, unknown>[] {
  if (!node || typeof node !== "object") return [];
  const inner = (node as Record<string, unknown>)[itemKey];
  if (Array.isArray(inner)) return inner as Record<string, unknown>[];
  if (inner && typeof inner === "object") return [inner as Record<string, unknown>];
  return [];
}

function str(v: unknown): string | undefined {
  return v === undefined || v === null ? undefined : String(v);
}

function mapProduct(p: Record<string, unknown>): AeProduct {
  return {
    productId: String(p.product_id ?? ""),
    title: String(p.product_title ?? ""),
    imageUrl: str(p.product_main_image_url),
    salePrice: str(p.target_sale_price ?? p.sale_price),
    originalPrice: str(p.target_original_price ?? p.original_price),
    currency: CURRENCY(),
    discount: str(p.discount),
    rating: str(p.evaluate_rate),
    orders: p.lastest_volume ? Number(p.lastest_volume) : undefined,
    promotionUrl: str(p.promotion_link),
    categoryId: str(p.second_level_category_id ?? p.first_level_category_id),
    shopUrl: str(p.shop_url),
  };
}

/** Generate affiliate (tracked) links for up to 10 source URLs in one call. */
export async function generateAffiliateLinks(
  sourceUrls: string[],
  trackingId: string,
  shipToCountry?: string
): Promise<Map<string, string>> {
  const inner = await callApi("aliexpress.affiliate.link.generate", {
    source_values: sourceUrls.join(","),
    promotion_link_type: "0",
    tracking_id: trackingId,
    ship_to_country: shipToCountry || COUNTRY(),
  });
  const result = unwrapResult(inner);
  const map = new Map<string, string>();
  if (!result) return map;
  for (const link of asArray(result.promotion_links, "promotion_link")) {
    const src = str(link.source_value);
    const promo = str(link.promotion_link);
    if (src && promo) map.set(src, promo);
  }
  return map;
}

/** Promotion info for a single product — used to enrich eligibility / pricing. */
export async function getPromotionInfo(productId: string, shipToCountry?: string) {
  const inner = await callApi("aliexpress.affiliate.promotion.info.get", {
    product_id: productId,
    currency: CURRENCY(),
    target_language: "EN",
    ship_to_country: shipToCountry || COUNTRY(),
  });
  return unwrapResult(inner);
}

/** Similar products via smartmatch (designed for "you might also like"). */
export async function smartMatch(opts: {
  productId?: string;
  keywords?: string;
  trackingId: string;
  pageNo?: number;
  country?: string;
}): Promise<AeProduct[]> {
  const inner = await callApi("aliexpress.affiliate.product.smartmatch", {
    product_id: opts.productId,
    keywords: opts.keywords,
    tracking_id: opts.trackingId,
    page_no: opts.pageNo ?? 1,
    target_currency: CURRENCY(),
    target_language: "EN",
    country: opts.country || COUNTRY(),
    fields: PRODUCT_FIELDS,
  });
  const result = unwrapResult(inner);
  if (!result) return [];
  return asArray(result.products, "product").map(mapProduct).filter((p) => p.productId);
}

/** Keyword/category product search. */
export async function queryProducts(opts: {
  keywords?: string;
  categoryIds?: string;
  trackingId: string;
  pageNo?: number;
  pageSize?: number;
  sort?: string;
  shipToCountry?: string;
}): Promise<AeProduct[]> {
  const inner = await callApi("aliexpress.affiliate.product.query", {
    keywords: opts.keywords,
    category_ids: opts.categoryIds,
    tracking_id: opts.trackingId,
    page_no: opts.pageNo ?? 1,
    page_size: opts.pageSize ?? 20,
    sort: opts.sort,
    platform_product_type: "ALL",
    target_currency: CURRENCY(),
    target_language: "EN",
    ship_to_country: opts.shipToCountry || COUNTRY(),
    fields: PRODUCT_FIELDS,
  });
  const result = unwrapResult(inner);
  if (!result) return [];
  return asArray(result.products, "product").map(mapProduct).filter((p) => p.productId);
}

/** Hot products — used for cold-start recommendations. */
export async function getHotProducts(opts: {
  trackingId: string;
  categoryIds?: string;
  keywords?: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<AeProduct[]> {
  const inner = await callApi("aliexpress.affiliate.hotproduct.query", {
    tracking_id: opts.trackingId,
    category_ids: opts.categoryIds,
    keywords: opts.keywords,
    page_no: opts.pageNo ?? 1,
    page_size: opts.pageSize ?? 20,
    platform_product_type: "ALL",
    target_currency: CURRENCY(),
    target_language: "EN",
    ship_to_country: COUNTRY(),
    fields: PRODUCT_FIELDS,
  });
  const result = unwrapResult(inner);
  if (!result) return [];
  return asArray(result.products, "product").map(mapProduct).filter((p) => p.productId);
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  const inner = await callApi("aliexpress.affiliate.category.get", {});
  const result = unwrapResult(inner);
  if (!result) return [];
  return asArray(result.categories, "category").map((c) => ({
    id: String(c.category_id ?? ""),
    name: String(c.category_name ?? ""),
  }));
}

/**
 * List affiliate orders for a tracking ID. Returns BOTH GMV and commission fields; callers
 * must strip commission before sending to non-admin users (see dto/order.ts).
 */
export async function listOrders(opts: {
  startTime: string; // "yyyy-MM-dd HH:mm:ss"
  endTime: string;
  status?: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<{ orders: OrderSummary[]; rawCommission: Record<string, string | undefined> }> {
  const inner = await callApi("aliexpress.affiliate.order.list", {
    time_type: "Payment Completed Time",
    start_time: opts.startTime,
    end_time: opts.endTime,
    status: opts.status,
    page_no: opts.pageNo ?? 1,
    page_size: opts.pageSize ?? 50,
    fields: "order_id,order_status,paid_time,created_time,product_count,order_amount,product_main_image_url,product_title,product_id,estimated_paid_commission,commission_rate,category_name",
  });
  const result = unwrapResult(inner);
  const orders: OrderSummary[] = [];
  const rawCommission: Record<string, string | undefined> = {};
  if (!result) return { orders, rawCommission };
  for (const o of asArray(result.orders, "order")) {
    const orderId = String(o.order_id ?? o.order_number ?? "");
    orders.push({
      orderId,
      status: str(o.order_status),
      productTitle: str(o.product_title),
      productId: str(o.product_id),
      orderValue: str(o.order_amount),
      currency: CURRENCY(),
      createdAt: str(o.created_time),
      paidTime: str(o.paid_time),
      category: str(o.category_name),
    });
    // commission kept OUT of OrderSummary; surfaced only to admin via this side channel.
    rawCommission[orderId] = str(o.estimated_paid_commission ?? o.commission_rate);
  }
  return { orders, rawCommission };
}

export async function getShipping(opts: {
  productId: string;
  skuId?: string;
  shipToCountry?: string;
  targetSalePrice?: string;
}): Promise<ShippingInfo | null> {
  const inner = await callApi("aliexpress.affiliate.product.shipping.get", {
    product_id: opts.productId,
    sku_id: opts.skuId,
    ship_to_country: opts.shipToCountry || COUNTRY(),
    target_currency: CURRENCY(),
    target_sale_price: opts.targetSalePrice,
    target_language: "en",
  });
  const result = unwrapResult(inner);
  if (!result) return null;
  const list = asArray(result.aeop_freight_calculate_result_for_buyer_d_t_o_list, "aeop_freight_calculate_result_for_buyer_d_t_o");
  const first = list[0];
  return {
    productId: opts.productId,
    estimatedDeliveryDays: first?.max_delivery_days ? Number(first.max_delivery_days) : undefined,
    shippingFee: str(first?.freight_amount ?? first?.fee),
    currency: CURRENCY(),
    serviceName: str(first?.service_name),
  };
}
