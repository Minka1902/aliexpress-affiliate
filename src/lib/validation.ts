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
});

export const adminUserActionSchema = z.object({
  action: z.enum(["approve", "reject", "assignTracking"]),
  trackingId: z.string().trim().max(120).optional(),
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
