"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useLocalList } from "@/hooks/useLocalList";
import { startTour } from "@/components/tour";
import { useSeedMode } from "@/components/SeedModeProvider";
import { Icon } from "@/components/Icon";
import { isAliExpressUrl } from "@/lib/aliexpress/match-url";
import type { Entitlements } from "@/lib/roles";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function TopBar({
  isAdmin,
  theme,
  locale,
  features,
}: {
  isAdmin: boolean;
  theme: string;
  locale: string;
  features: Entitlements;
}) {
  const t = useTranslations();
  const router = useRouter();
  const cart = useLocalList("cart");
  const wishlist = useLocalList("wishlist");
  const { seedMode, enable } = useSeedMode();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => setMounted(true), []);

  async function persist(body: Record<string, string>) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  function onTheme(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setCookie("theme", value);
    document.documentElement.setAttribute("data-theme", value);
    persist({ theme: value });
    router.refresh();
  }

  function onLocale(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setCookie("locale", value);
    persist({ locale: value });
    router.refresh();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    // A pasted AliExpress URL → generator; a keyword → browse/search.
    if (isAliExpressUrl(q)) {
      router.push(`/dashboard/link-generator?shared=${encodeURIComponent(q)}&auto=1`);
    } else {
      router.push(`/dashboard/browse?q=${encodeURIComponent(q)}`);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  const selectClass =
    "bg-white/20 text-white text-xs rounded px-1.5 py-1 [&>option]:text-black";

  return (
    <header className="bg-brand-gradient text-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <Link href="/dashboard" className="font-extrabold text-lg whitespace-nowrap">
          {t("app.name")}
        </Link>

        <form onSubmit={onSearch} className="hidden sm:flex flex-1 max-w-md" data-tour="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("nav.search")}
            className="w-full rounded-s-full px-4 py-1.5 text-sm text-ink bg-white outline-none"
          />
          <button
            type="submit"
            className="rounded-e-full bg-ink/80 hover:bg-ink px-4 flex items-center text-white"
            aria-label={t("nav.search")}
          >
            <Icon name="search" size={16} />
          </button>
        </form>

        <nav className="hidden md:flex items-center gap-3 text-sm">
          <Link data-tour="dashboard" href="/dashboard" className="hover:underline">
            {t("nav.dashboard")}
          </Link>
          <Link data-tour="link" href="/dashboard/link-generator" className="hover:underline">
            {t("nav.linkGenerator")}
          </Link>
          <Link href="/dashboard/browse" className="hover:underline">
            {t("nav.browse")}
          </Link>
          <Link href="/dashboard/orders" className="hover:underline">
            {t("nav.orders")}
          </Link>
          <Link href="/dashboard/library" className="hover:underline">
            {t("nav.library")}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:underline font-semibold">
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        <div className="flex-1 sm:flex-none" />

        <button
          onClick={() => startTour({ next: "→", done: "✓" })}
          className="hidden lg:inline text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
        >
          {t("nav.takeTour")}
        </button>

        {isAdmin && (
          <button
            onClick={enable}
            title={seedMode ? t("admin.seedOn") : t("admin.seed")}
            className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
              seedMode ? "bg-yellow-300 text-black" : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <Icon name="seed" size={12} />
            {seedMode ? t("admin.seedOn") : t("admin.seed")}
          </button>
        )}

        <span className="hidden sm:flex items-center gap-1">
          <Icon name="language" size={14} />
          <select aria-label="language" value={locale} onChange={onLocale} className={selectClass}>
            <option value="en">EN</option>
            <option value="he">עב</option>
            <option value="ru">RU</option>
          </select>
        </span>

        <span className="hidden sm:flex items-center gap-1">
          <Icon name="theme" size={14} />
          <select aria-label="theme" value={theme} onChange={onTheme} className={selectClass}>
            <option value="aliexpress">{t("themes.aliexpress")}</option>
            <option value="dark">{t("themes.dark")}</option>
            <option value="contrast">{t("themes.contrast")}</option>
          </select>
        </span>

        <Link
          data-tour="cart"
          href={features.cart ? "/dashboard/cart" : "/dashboard/pay"}
          className="relative hidden md:inline-flex items-center"
          aria-label={t("nav.cart")}
        >
          <Icon name={features.cart ? "cart" : "lock"} size={18} />
          {mounted && features.cart && cart.items.length > 0 && (
            <span className="absolute -top-2 -end-2 bg-white text-brand text-[10px] rounded-full px-1">
              {cart.items.length}
            </span>
          )}
        </Link>
        <Link
          data-tour="wishlist"
          href={features.wishlist ? "/dashboard/wishlist" : "/dashboard/pay"}
          className="relative hidden md:inline-flex items-center"
          aria-label={t("nav.wishlist")}
        >
          <Icon name={features.wishlist ? "heart" : "lock"} size={18} />
          {mounted && features.wishlist && wishlist.items.length > 0 && (
            <span className="absolute -top-2 -end-2 bg-white text-brand text-[10px] rounded-full px-1">
              {wishlist.items.length}
            </span>
          )}
        </Link>
        <button
          onClick={signOut}
          className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
        >
          {t("nav.signout")}
        </button>
      </div>
    </header>
  );
}
