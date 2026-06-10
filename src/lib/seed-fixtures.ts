// Deterministic in-memory fixtures for the admin "seed/demo" mode. No DB writes; used only
// to populate the admin console (users, orders, stats) when seed mode is on.

export interface SeedUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "FAMILY" | "PARTNERS_FAMILY" | "FRIENDS" | "PARTNERS_FRIENDS" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  trackingId: string | null;
  unlockedAi: boolean;
  unlockedCart: boolean;
  unlockedWishlist: boolean;
  createdAt: string;
}

export interface SeedOrder {
  orderId: string;
  status?: string;
  productTitle?: string;
  orderValue?: string;
  currency?: string;
  createdAt?: string;
  category?: string;
  commission?: string | null;
}

const NAMES = ["Dana", "Yossi", "Maya", "Ivan", "Noa", "Leon", "Tamar", "Sergei"];
const ROLES: SeedUser["role"][] = ["USER", "FAMILY", "FRIENDS", "PARTNERS_FAMILY", "PARTNERS_FRIENDS"];
const PRODUCTS = [
  "Wireless Earbuds Pro",
  "USB-C Fast Charger 65W",
  "LED Strip Lights 5m",
  "Mini Action Camera 4K",
  "Mechanical Keyboard",
  "Smart Watch Fitness",
];
const STATUSES = ["Payment Completed", "Shipped", "Finished"];

export function seedAdminUsers(): SeedUser[] {
  return NAMES.map((name, i) => ({
    id: `seed_${i}`,
    email: `${name.toLowerCase()}@example.com`,
    name,
    role: i === 0 ? "ADMIN" : ROLES[i % ROLES.length],
    status: i === 5 ? "BANNED" : "ACTIVE",
    trackingId: i === 0 ? null : i % 2 === 0 ? "default_track" : `personal_${i}`,
    unlockedAi: i % 2 === 0,
    unlockedCart: i % 3 === 0,
    unlockedWishlist: i % 4 === 0,
    createdAt: new Date(Date.now() - i * 86400000 * 9).toISOString(),
  }));
}

export function seedAdminOrders(): { orders: SeedOrder[]; summary: { count: number; gmv: string; commission: string; currency: string } } {
  const orders: SeedOrder[] = PRODUCTS.map((title, i) => {
    const value = 19.99 + i * 12.5;
    return {
      orderId: `SEED${1000 + i}`,
      status: STATUSES[i % STATUSES.length],
      productTitle: title,
      orderValue: value.toFixed(2),
      currency: "USD",
      createdAt: new Date(Date.now() - i * 86400000 * 4).toISOString().slice(0, 10),
      category: i % 2 ? "Electronics" : "Home",
      commission: (value * 0.08).toFixed(2),
    };
  });
  const gmv = orders.reduce((s, o) => s + parseFloat(o.orderValue || "0"), 0);
  const commission = orders.reduce((s, o) => s + parseFloat(o.commission || "0"), 0);
  return {
    orders,
    summary: { count: orders.length, gmv: gmv.toFixed(2), commission: commission.toFixed(2), currency: "USD" },
  };
}

export function seedUserStats(seed: number) {
  const orderCount = (seed % 5) + 1;
  const gmv = orderCount * 34.5;
  return {
    linkCount: (seed % 7) + 2,
    orderCount,
    gmv: gmv.toFixed(2),
    commission: (gmv * 0.08).toFixed(2),
    currency: "USD",
  };
}
