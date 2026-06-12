"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useLocalList } from "@/hooks/useLocalList";
import { Icon, type IconName } from "@/components/Icon";
import type { Entitlements } from "@/lib/roles";

export function BottomNav({ features }: { features: Entitlements }) {
  const t = useTranslations();
  const pathname = usePathname();
  const cart = useLocalList("cart");
  const wishlist = useLocalList("wishlist");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tabs: { href: string; icon: IconName; label: string; badge: number }[] = [
    { href: "/dashboard", icon: "home", label: t("nav.dashboard"), badge: 0 },
    { href: "/dashboard/link-generator", icon: "link", label: t("nav.linkGenerator"), badge: 0 },
    {
      href: features.cart ? "/dashboard/cart" : "/dashboard/pay",
      icon: features.cart ? "cart" : "lock",
      label: t("nav.cart"),
      badge: mounted && features.cart ? cart.items.length : 0,
    },
    {
      href: features.wishlist ? "/dashboard/wishlist" : "/dashboard/pay",
      icon: features.wishlist ? "heart" : "lock",
      label: t("nav.wishlist"),
      badge: mounted && features.wishlist ? wishlist.items.length : 0,
    },
    { href: "/dashboard/settings", icon: "settings", label: t("nav.account"), badge: 0 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line flex">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-[11px] gap-0.5 ${
              active ? "text-brand" : "text-ink-muted"
            }`}
          >
            <span className="relative leading-none">
              <Icon name={tab.icon} size={20} />
              {tab.badge > 0 && (
                <span className="absolute -top-1.5 -end-2 bg-brand text-white text-[9px] rounded-full px-1 leading-tight">
                  {tab.badge}
                </span>
              )}
            </span>
            <span className="truncate max-w-[64px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
