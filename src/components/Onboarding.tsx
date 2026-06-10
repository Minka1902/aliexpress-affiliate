"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { startTour } from "@/components/tour";

type Theme = "aliexpress" | "dark" | "contrast";
type Locale = "en" | "he" | "ru";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

// First-login wizard: pick theme + language (+ ship country) BEFORE the app tour runs.
export function Onboarding({ theme: initialTheme, locale: initialLocale }: { theme: string; locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>((initialTheme as Theme) || "aliexpress");
  const [locale, setLocale] = useState<Locale>((initialLocale as Locale) || "en");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function finish() {
    setBusy(true);
    setCookie("theme", theme);
    setCookie("locale", locale);
    document.documentElement.setAttribute("data-theme", theme);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme,
        locale,
        shipToCountry: country || undefined,
        onboarded: true,
      }),
    }).catch(() => {});
    setOpen(false);
    router.refresh();
    // Kick off the product tour right after onboarding.
    setTimeout(() => startTour({ next: "→", done: "✓" }), 300);
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-card w-full max-w-md p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">{t("onboarding.title")}</h2>
          <p className="text-sm text-ink-muted mt-1">{t("onboarding.subtitle")}</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.theme")}</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="input">
            <option value="aliexpress">{t("themes.aliexpress")}</option>
            <option value="dark">{t("themes.dark")}</option>
            <option value="contrast">{t("themes.contrast")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.language")}</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="input">
            <option value="en">English</option>
            <option value="he">עברית</option>
            <option value="ru">Русский</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.shipTo")}</span>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            placeholder="US"
            className="input uppercase"
          />
        </label>

        <button onClick={finish} disabled={busy} className="btn-primary mt-2">
          {t("onboarding.start")}
        </button>
      </div>
    </div>
  );
}
