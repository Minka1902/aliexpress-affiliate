import { describe, it, expect } from "vitest";
import type { User } from "@prisma/client";
import { toPublicUser, toAdminUser } from "./user";

const base: User = {
  id: "u1",
  email: "a@b.com",
  name: "A",
  passwordHash: "HASH",
  role: "USER",
  status: "ACTIVE",
  trackingId: "secret_track",
  unlockedAi: true,
  unlockedCart: false,
  unlockedWishlist: false,
  onboardedAt: null,
  theme: "aliexpress",
  locale: "en",
  shipToCountry: "US",
  aiProvider: "claude",
  aiKeyEncrypted: "ENC",
  dsAccessTokenEnc: "ENC",
  dsRefreshTokenEnc: "ENC",
  dsTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as User;

describe("toPublicUser privacy", () => {
  it("never leaks trackingId, password, or secrets", () => {
    const pub = toPublicUser(base) as unknown as Record<string, unknown>;
    expect(pub.trackingId).toBeUndefined();
    expect(pub.passwordHash).toBeUndefined();
    expect(pub.aiKeyEncrypted).toBeUndefined();
    expect(pub.dsAccessTokenEnc).toBeUndefined();
    expect(pub.hasAiKey).toBe(true);
    expect(pub.features).toEqual({ ai: true, cart: false, wishlist: false });
  });
});

describe("toAdminUser", () => {
  it("includes trackingId but never passwordHash", () => {
    const a = toAdminUser(base) as unknown as Record<string, unknown>;
    expect(a.trackingId).toBe("secret_track");
    expect(a.passwordHash).toBeUndefined();
  });
});
