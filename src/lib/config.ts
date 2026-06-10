import { prisma } from "./prisma";
import type { AppConfig } from "@prisma/client";

const DEFAULTS = {
  id: 1,
  priceAi: 500,
  priceCart: 300,
  priceWishlist: 300,
  priceBundle: 900,
  bundleEnabled: true,
  currency: process.env.DEFAULT_CURRENCY || "USD",
  defaultTrackingId: process.env.DEFAULT_TRACKING_ID || null,
};

/** Returns the singleton AppConfig row, creating it with defaults on first access. */
export async function getConfig(): Promise<AppConfig> {
  const existing = await prisma.appConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.appConfig.create({ data: DEFAULTS });
}

/** The tracking id assigned to self-signup USER accounts. */
export async function defaultTrackingId(): Promise<string | null> {
  const cfg = await getConfig();
  return cfg.defaultTrackingId || process.env.DEFAULT_TRACKING_ID || null;
}
