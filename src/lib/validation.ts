import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

export const signinSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const generateLinkSchema = z.object({
  // one or more AliExpress URLs
  urls: z.array(z.string().trim().min(5).max(2000)).min(1).max(10),
});

export const wishlistRecheckSchema = z.object({
  productIds: z.array(z.string().trim().min(1).max(40)).max(10),
});

export const settingsSchema = z.object({
  theme: z.enum(["aliexpress", "dark", "contrast"]).optional(),
  locale: z.enum(["en", "he", "ru"]).optional(),
  shipToCountry: z.string().trim().length(2).optional(),
  aiProvider: z.enum(["claude", "openai", "gemini"]).nullable().optional(),
  aiKey: z.string().trim().max(400).nullable().optional(),
  onboarded: z.boolean().optional(),
});

export const ROLES = [
  "USER",
  "FAMILY",
  "PARTNERS_FAMILY",
  "FRIENDS",
  "PARTNERS_FRIENDS",
  "ADMIN",
] as const;

// Admin edits a user (any subset of fields).
export const adminUserEditSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(200).optional(),
  role: z.enum(ROLES).optional(),
  trackingId: z.string().trim().max(120).nullable().optional(),
  status: z.enum(["ACTIVE", "BANNED"]).optional(),
  unlockedAi: z.boolean().optional(),
  unlockedCart: z.boolean().optional(),
  unlockedWishlist: z.boolean().optional(),
});

export const adminConfigSchema = z.object({
  priceAi: z.number().int().min(0).max(1_000_000).optional(),
  priceCart: z.number().int().min(0).max(1_000_000).optional(),
  priceWishlist: z.number().int().min(0).max(1_000_000).optional(),
  priceBundle: z.number().int().min(0).max(1_000_000).optional(),
  bundleEnabled: z.boolean().optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  defaultTrackingId: z.string().trim().max(120).nullable().optional(),
});

export const paySchema = z.object({
  target: z.enum(["ai", "cart", "wishlist", "bundle"]),
});

export const aiCheckSchema = z.object({
  products: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(40),
        title: z.string().trim().max(500).optional(),
        url: z.string().trim().max(2000).optional(),
      })
    )
    .min(1)
    .max(10),
});
