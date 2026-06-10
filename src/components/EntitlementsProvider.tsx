"use client";

import { createContext, useContext } from "react";
import type { Entitlements } from "@/lib/roles";

const EntitlementsContext = createContext<Entitlements>({ ai: false, cart: false, wishlist: false });

export function useEntitlements() {
  return useContext(EntitlementsContext);
}

export function EntitlementsProvider({
  value,
  children,
}: {
  value: Entitlements;
  children: React.ReactNode;
}) {
  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}
