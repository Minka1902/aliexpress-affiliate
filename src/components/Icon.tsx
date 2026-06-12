"use client";

import dynamic from "next/dynamic";
import type { IconName } from "./IconImpl";

export type { IconName };

// Load the heavy msr-icons-backed glyph lazily so the 1.6MB icon library stays out of the
// critical first-load bundle. A sized span reserves space so there's no layout shift.
const Glyph = dynamic(() => import("./IconImpl"), { ssr: false, loading: () => null });

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`ico ${className}`} style={{ width: size, height: size }} aria-hidden>
      <Glyph name={name} />
    </span>
  );
}
