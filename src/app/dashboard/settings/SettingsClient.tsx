"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Theme = "aliexpress" | "dark" | "contrast";
type Locale = "en" | "he" | "ru";
type AiProvider = "claude" | "openai" | "gemini";

interface Me {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  theme: Theme;
  locale: Locale;
  shipToCountry: string;
  aiProvider: AiProvider | null;
  hasAiKey: boolean;
}

interface MeResponse {
  user: Me | null;
}

interface SettingsPatch {
  theme?: Theme;
  locale?: Locale;
  shipToCountry?: string;
  aiProvider?: AiProvider | null;
  aiKey?: string | null;
}

export function SettingsClient() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [hasAiKey, setHasAiKey] = useState(false);
  const [initial, setInitial] = useState<{
    theme: Theme;
    locale: Locale;
    shipToCountry: string;
    aiProvider: "none" | AiProvider;
  } | null>(null);

  const [theme, setTheme] = useState<Theme>("aliexpress");
  const [locale, setLocale] = useState<Locale>("en");
  const [shipToCountry, setShipToCountry] = useState("");
  const [aiProvider, setAiProvider] = useState<"none" | AiProvider>("none");
  const [aiKey, setAiKey] = useState("");
  const [clipboardAuto, setClipboardAuto] = useState(true);

  useEffect(() => {
    setClipboardAuto(localStorage.getItem("clipboardAutoDetect") !== "off");
  }, []);

  function toggleClipboard(on: boolean) {
    setClipboardAuto(on);
    localStorage.setItem("clipboardAutoDetect", on ? "on" : "off");
  }

  const router = useRouter();
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: fd.get("currentPassword"),
        newPassword: fd.get("newPassword"),
      }),
    });
    if (res.ok) {
      setPwMsg(t("settings.saved"));
      (e.target as HTMLFormElement).reset();
    } else {
      setPwMsg(t("settings.wrongPassword"));
    }
  }

  async function deleteAccount() {
    if (!confirm(t("settings.deleteConfirm"))) return;
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      router.push("/signin");
      router.refresh();
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("failed");
        const json: MeResponse = await res.json();
        if (!active) return;
        const u = json.user;
        if (!u) {
          setError(true);
          return;
        }
        const prov: "none" | AiProvider = u.aiProvider ?? "none";
        setTheme(u.theme);
        setLocale(u.locale);
        setShipToCountry(u.shipToCountry ?? "");
        setAiProvider(prov);
        setHasAiKey(u.hasAiKey);
        setInitial({
          theme: u.theme,
          locale: u.locale,
          shipToCountry: u.shipToCountry ?? "",
          aiProvider: prov,
        });
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!initial) return;
    setSaving(true);
    setSaved(false);

    const body: SettingsPatch = {};
    const themeChanged = theme !== initial.theme;
    const localeChanged = locale !== initial.locale;

    if (themeChanged) body.theme = theme;
    if (localeChanged) body.locale = locale;
    if (shipToCountry !== initial.shipToCountry) body.shipToCountry = shipToCountry;

    if (aiProvider !== initial.aiProvider) {
      if (aiProvider === "none") {
        body.aiProvider = null;
        body.aiKey = null;
      } else {
        body.aiProvider = aiProvider;
      }
    }

    if (aiProvider !== "none" && aiKey !== "") {
      body.aiKey = aiKey;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      setSaved(true);
      if (themeChanged || localeChanged) {
        location.reload();
        return;
      }
      // Refresh local baseline so subsequent saves diff correctly.
      setInitial({ theme, locale, shipToCountry, aiProvider });
      if (aiProvider === "none") setHasAiKey(false);
      else if (aiKey !== "") setHasAiKey(true);
      setAiKey("");
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-ink-muted">{t("common.loading")}</p>;
  }
  if (error) {
    return <p className="text-ink-muted">{t("common.error")}</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-lg font-semibold text-ink">{t("settings.title")}</h1>

      <div className="card flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.theme")}</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="input"
          >
            <option value="aliexpress">{t("themes.aliexpress")}</option>
            <option value="dark">{t("themes.dark")}</option>
            <option value="contrast">{t("themes.contrast")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.language")}</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="input"
          >
            <option value="en">English</option>
            <option value="he">עברית</option>
            <option value="ru">Русский</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.shipTo")}</span>
          <input
            value={shipToCountry}
            onChange={(e) =>
              setShipToCountry(e.target.value.toUpperCase().slice(0, 2))
            }
            maxLength={2}
            placeholder="US"
            className="input uppercase"
          />
        </label>
      </div>

      <div className="card flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">{t("settings.ai")}</h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t("settings.aiProvider")}</span>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as "none" | AiProvider)}
            className="input"
          >
            <option value="none">—</option>
            <option value="claude">Claude</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>

        {aiProvider !== "none" && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink">{t("settings.aiKey")}</span>
            <input
              type="password"
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder={hasAiKey ? "•••••• (set)" : ""}
              className="input"
            />
            <span className="text-xs text-ink-muted">{t("settings.aiKeyHint")}</span>
          </label>
        )}
      </div>

      <div className="card">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={clipboardAuto}
            onChange={(e) => toggleClipboard(e.target.checked)}
          />
          {t("settings.clipboardAutoDetect")}
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? t("common.loading") : t("settings.save")}
        </button>
        {saved && <span className="text-sm text-brand">{t("settings.saved")}</span>}
      </div>

      {/* Change password */}
      <form onSubmit={changePassword} className="card flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">{t("settings.changePassword")}</h2>
        <input
          name="currentPassword"
          type="password"
          required
          placeholder={t("settings.currentPassword")}
          className="input"
        />
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder={t("settings.newPassword")}
          className="input"
        />
        {pwMsg && <span className="text-sm text-brand">{pwMsg}</span>}
        <button type="submit" className="btn-primary self-start">
          {t("settings.changePassword")}
        </button>
      </form>

      {/* Danger zone */}
      <div className="card border border-red-200 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-red-700">{t("settings.deleteAccount")}</h2>
        <button
          onClick={deleteAccount}
          className="self-start rounded-full px-4 py-2 text-sm bg-red-600 text-white hover:opacity-90"
        >
          {t("settings.deleteAccount")}
        </button>
      </div>
    </div>
  );
}
