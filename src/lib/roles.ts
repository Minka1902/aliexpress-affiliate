import type { Role, User } from "@prisma/client";

export const PRIVILEGED_ROLES: Role[] = [
  "FAMILY",
  "PARTNERS_FAMILY",
  "FRIENDS",
  "PARTNERS_FRIENDS",
];

export function isPrivilegedRole(role: Role): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

export function isAdminRole(user: Pick<User, "role" | "email">): boolean {
  return user.role === "ADMIN" && user.email === process.env.ADMIN_EMAIL;
}

export interface Entitlements {
  ai: boolean;
  cart: boolean;
  wishlist: boolean;
}

/**
 * Computes which paid features a user can access. ADMIN and the trusted (privileged) roles
 * get everything for free; the self-signup USER role only gets what it has unlocked.
 */
export function entitlements(user: User): Entitlements {
  if (user.role === "ADMIN" || isPrivilegedRole(user.role)) {
    return { ai: true, cart: true, wishlist: true };
  }
  return {
    ai: user.unlockedAi,
    cart: user.unlockedCart,
    wishlist: user.unlockedWishlist,
  };
}

export type Feature = "ai" | "cart" | "wishlist";
