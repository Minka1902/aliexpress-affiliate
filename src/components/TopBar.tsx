"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useLocalList } from "@/hooks/useLocalList";
import { startTour } from "@/components/tour";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function TopBar({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const cart = useLocalList("cart");
  const wishlist = useLocalList("wishlist");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function persist(body: Record<string, string>) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  function onTheme(e: React.ChangeEvent<HTMLSelectElement>) {
    const theme = e.target.value;
    setCookie("theme", theme);
    persist({ theme });
    router.refresh();
    document.documentElement.setAttribute("data-theme", theme);
  }

  function onLocale(e: React.ChangeEvent<HTMLSelectElement>) {
    const locale = e.target.value;
    setCookie("locale", locale);
    persist({ locale });
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  return (
    <header className="bg-brand-gradient text-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <Link href="/dashboard" className="font-extrabold text-lg whitespace-nowrap">
          {t("app.name")}
        </Link>

        <nav className="hidden md:flex items-center gap-3 text-sm">
          <Link data-tour="dashboard" href="/dashboard" className="hover:underline">
            {t("nav.dashboard")}
          </Link>
          <Link data-tour="link" href="/dashboard/link-generator" className="hover:underline">
            {t("nav.linkGenerator")}
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

        <div className="flex-1" />

        <button
          onClick={() => startTour({ next: "→", done: "✓" })}
          className="hidden sm:inline text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
        >
          {t("nav.takeTour")}
        </button>

        <select
          aria-label="language"
          onChange={onLocale}
          className="bg-white/20 text-white text-xs rounded px-1 py-1 [&>option]:text-black"
          defaultValue=""
        >
          <option value="" disabled>
            🌐
          </option>
          <option value="en">EN</option>
          <option value="he">עב</option>
          <option value="ru">RU</option>
        </select>

        <select
          aria-label="theme"
          onChange={onTheme}
          className="bg-white/20 text-white text-xs rounded px-1 py-1 [&>option]:text-black"
          defaultValue=""
        >
          <option value="" disabled>
            🎨
          </option>
          <option value="aliexpress">{t("themes.aliexpress")}</option>
          <option value="dark">{t("themes.dark")}</option>
          <option value="contrast">{t("themes.contrast")}</option>
        </select>

        <Link data-tour="cart" href="/dashboard/cart" className="relative text-sm">
          🛒
          {mounted && cart.items.length > 0 && (
            <span className="absolute -top-2 -end-2 bg-white text-brand text-[10px] rounded-full px-1">
              {cart.items.length}
            </span>
          )}
        </Link>
        <Link data-tour="wishlist" href="/dashboard/wishlist" className="relative text-sm">
          ♡
          {mounted && wishlist.items.length > 0 && (
            <span className="absolute -top-2 -end-2 bg-white text-brand text-[10px] rounded-full px-1">
              {wishlist.items.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/settings" className="text-sm">
          ⚙
        </Link>
        <button onClick={signOut} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30">
          {t("nav.signout")}
        </button>
      </div>
    </header>
  );
}
