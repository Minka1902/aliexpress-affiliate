"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Non-blocking "verify your email" banner shown when the account isn't verified yet.
export function VerifyBanner() {
  const t = useTranslations();
  const [hidden, setHidden] = useState(false);
  const [sent, setSent] = useState(false);
  if (hidden) return null;

  async function resend() {
    await fetch("/api/auth/verify/resend", { method: "POST" }).catch(() => {});
    setSent(true);
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="flex-1">{t("verify.banner")}</span>
        {sent ? (
          <span className="text-amber-700">{t("verify.sent")}</span>
        ) : (
          <button onClick={resend} className="underline font-medium">
            {t("verify.resend")}
          </button>
        )}
        <button onClick={() => setHidden(true)} aria-label="dismiss" className="text-amber-700">
          ✕
        </button>
      </div>
    </div>
  );
}
