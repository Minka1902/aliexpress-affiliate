"use client";

import { createContext, useContext, useState } from "react";

interface SeedModeApi {
  seedMode: boolean;
  enable: () => void;
}

const SeedModeContext = createContext<SeedModeApi>({ seedMode: false, enable: () => {} });

export function useSeedMode() {
  return useContext(SeedModeContext);
}

// In-memory only: seed mode is enabled by the admin and resets on page refresh.
export function SeedModeProvider({ children }: { children: React.ReactNode }) {
  const [seedMode, setSeedMode] = useState(false);
  return (
    <SeedModeContext.Provider value={{ seedMode, enable: () => setSeedMode(true) }}>
      {children}
    </SeedModeContext.Provider>
  );
}
