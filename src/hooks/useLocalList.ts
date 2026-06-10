"use client";

import { useCallback, useEffect, useState } from "react";

export interface LocalProduct {
  productId: string;
  title?: string;
  imageUrl?: string;
  salePrice?: string;
  currency?: string;
  sourceUrl?: string;
  proxyUrl?: string; // our /go/<id> link (hides tracking id) when eligible
  addedAt: number;
}

const MAX = 10;

/** A localStorage-backed product list capped at 10 items (cart / wishlist). */
export function useLocalList(key: string) {
  const [items, setItems] = useState<LocalProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  const persist = useCallback(
    (next: LocalProduct[]) => {
      setItems(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [key]
  );

  const add = useCallback(
    (p: Omit<LocalProduct, "addedAt">): { ok: boolean; reason?: "exists" | "full" } => {
      let result: { ok: boolean; reason?: "exists" | "full" } = { ok: true };
      setItems((prev) => {
        if (prev.some((x) => x.productId === p.productId)) {
          result = { ok: false, reason: "exists" };
          return prev;
        }
        if (prev.length >= MAX) {
          result = { ok: false, reason: "full" };
          return prev;
        }
        const next = [...prev, { ...p, addedAt: Date.now() }];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      return result;
    },
    [key]
  );

  const remove = useCallback(
    (productId: string) => {
      persist(items.filter((x) => x.productId !== productId));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, ready, add, remove, clear, max: MAX };
}
