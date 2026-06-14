import { describe, it, expect } from "vitest";
import type { User } from "@prisma/client";
import { entitlements, isPrivilegedRole } from "./roles";

function u(partial: Partial<User>): User {
  return {
    role: "USER",
    unlockedAi: false,
    unlockedCart: false,
    unlockedWishlist: false,
    ...partial,
  } as unknown as User;
}

describe("entitlements", () => {
  it("admin gets everything", () => {
    expect(entitlements(u({ role: "ADMIN" }))).toEqual({ ai: true, cart: true, wishlist: true });
  });
  it("privileged roles get everything free", () => {
    for (const role of ["FAMILY", "FRIENDS", "PARTNERS_FAMILY", "PARTNERS_FRIENDS"] as const) {
      expect(entitlements(u({ role }))).toEqual({ ai: true, cart: true, wishlist: true });
      expect(isPrivilegedRole(role)).toBe(true);
    }
  });
  it("USER only gets unlocked flags", () => {
    expect(entitlements(u({ role: "USER", unlockedCart: true }))).toEqual({
      ai: false,
      cart: true,
      wishlist: false,
    });
    expect(isPrivilegedRole("USER")).toBe(false);
  });
});
