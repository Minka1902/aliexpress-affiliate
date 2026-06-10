"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { extractAliExpressUrl } from "@/lib/aliexpress/match-url";

const PREF_KEY = "clipboardAutoDetect";
const SESSION_KEY = "clipboardLastHandled";

// Watches the clipboard (on focus/visibility) for an AliExpress link and offers a bottom
// banner to paste it into the generator. Silent-fails where the browser blocks reads.
export function ClipboardWatcher() {
  const t = useTranslations();
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof sessionStorage !== "undefined") {
      lastRef.current = sessionStorage.getItem(SESSION_KEY);
    }
  }, []);

  const check = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;
    if (localStorage.getItem(PREF_KEY) === "off") return;
    if (document.visibilityState !== "visible") return;
    try {
      const text = await navigator.clipboard.readText();
      const found = extractAliExpressUrl(text);
      if (found && found !== lastRef.current) {
        setUrl(found);
      }
    } catch {
      /* permission/focus/unsupported — silently ignore */
    }
  }, []);

  useEffect(() => {
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [check]);

  function handled(u: string) {
    lastRef.current = u;
    try {
      sessionStorage.setItem(SESSION_KEY, u);
    } catch {
      /* ignore */
    }
    setUrl(null);
  }

  function paste() {
    if (!url) return;
    const u = url;
    handled(u);
    router.push(`/dashboard/link-generator?shared=${encodeURIComponent(u)}&auto=1`);
  }

  function dismiss() {
    if (url) handled(url);
  }

  function dontAsk() {
    localStorage.setItem(PREF_KEY, "off");
    if (url) handled(url);
  }

  if (!url) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto card shadow-lg flex items-center gap-3 max-w-lg w-full">
        <span className="text-lg">🔗</span>
        <p className="text-sm text-ink flex-1 truncate">{t("clipboard.detected")}</p>
        <button onClick={paste} className="btn-primary text-sm py-1.5">
          {t("clipboard.paste")}
        </button>
        <button onClick={dismiss} className="text-sm text-ink-muted hover:text-ink">
          {t("clipboard.dismiss")}
        </button>
        <button onClick={dontAsk} className="text-xs text-ink-muted hover:text-ink underline">
          {t("clipboard.dontAsk")}
        </button>
      </div>
    </div>
  );
}
