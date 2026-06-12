// Heavy implementation: pulls glyphs from `msr-icons`. The package bundles all 2122 icons
// into one non-tree-shakeable module, so this whole module is loaded LAZILY by Icon.tsx
// (next/dynamic) to keep it out of the critical first-load bundle.
import type { ComponentType } from "react";
import {
  ShoppingCart,
  Heart,
  HeartFilled,
  Wishlist,
  Settings,
  Search,
  Home2,
  Link as LinkIcon,
  Language,
  Palette,
  Check,
  Close,
  Info,
  Ban,
  Trash,
  Edit,
  User,
  PriceTag,
  Seedling,
  Compass,
  Lock,
  QrCode,
  Box,
} from "msr-icons";

const ICONS = {
  cart: ShoppingCart,
  heart: Heart,
  heartFilled: HeartFilled,
  wishlist: Wishlist,
  settings: Settings,
  search: Search,
  home: Home2,
  link: LinkIcon,
  language: Language,
  theme: Palette,
  check: Check,
  close: Close,
  info: Info,
  ban: Ban,
  trash: Trash,
  edit: Edit,
  user: User,
  tag: PriceTag,
  seed: Seedling,
  tour: Compass,
  lock: Lock,
  qr: QrCode,
  box: Box,
} as const;

export type IconName = keyof typeof ICONS;

export default function Glyph({ name }: { name: IconName }) {
  // The package types mark some props as required; we render with defaults, so loosen here.
  const Cmp = ICONS[name] as unknown as ComponentType;
  return <Cmp />;
}
