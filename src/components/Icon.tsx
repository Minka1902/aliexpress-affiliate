// Single swap-point icon wrapper.
//
// We intend to use the `msr-icons` package for all icons, but msr-icons@1.0.6 ships no build
// output (no dist/), so it currently exports nothing — see MISSING-ICONS.md. Until a fixed
// version is published, this wrapper renders fallback glyphs. To adopt msr-icons later:
//   import { Heart, Settings /* ... */ } from "msr-icons";
//   and map `name` → the imported component, passing { size, className, fillColor }.

export type IconName =
  | "cart"
  | "heart"
  | "settings"
  | "search"
  | "home"
  | "link"
  | "globe"
  | "palette"
  | "check"
  | "close"
  | "info"
  | "ban"
  | "trash"
  | "edit"
  | "user"
  | "tag"
  | "seed"
  | "tour"
  | "lock";

const FALLBACK: Record<IconName, string> = {
  cart: "🛒",
  heart: "♡",
  settings: "⚙",
  search: "🔍",
  home: "🏠",
  link: "🔗",
  globe: "🌐",
  palette: "🎨",
  check: "✓",
  close: "✕",
  info: "ℹ",
  ban: "🚫",
  trash: "🗑",
  edit: "✎",
  user: "👤",
  tag: "🏷",
  seed: "🌱",
  tour: "🧭",
  lock: "🔒",
};

export function Icon({ name, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <span className={className} aria-hidden>
      {FALLBACK[name]}
    </span>
  );
}
