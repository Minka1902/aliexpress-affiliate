import { prisma } from "./prisma";
import type { User } from "@prisma/client";

export type PayTarget = "ai" | "cart" | "wishlist" | "bundle";

// Simulated payment provider: unlocking is instant. This is the single swap point for a real
// gateway (e.g. Stripe Checkout + webhook) later — see NEEDED_THINGS_FOR_STRIPE.md.
export async function unlock(userId: string, target: PayTarget): Promise<User> {
  const data =
    target === "bundle"
      ? { unlockedAi: true, unlockedCart: true, unlockedWishlist: true }
      : target === "ai"
        ? { unlockedAi: true }
        : target === "cart"
          ? { unlockedCart: true }
          : { unlockedWishlist: true };

  return prisma.user.update({ where: { id: userId }, data });
}
