"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ForgotPage() {
  const t = useTranslations();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = new FormData(e.currentTarget).get("email");
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-4 text-ink">{t("auth.forgotTitle")}</h1>
        {sent ? (
          <p className="text-sm text-ink-muted">{t("auth.forgotSent")}</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input name="email" type="email" required placeholder={t("auth.email")} className="input" />
            <button disabled={loading} className="btn-primary">
              {t("auth.forgotCta")}
            </button>
          </form>
        )}
        <p className="text-sm text-ink-muted mt-4 text-center">
          <Link href="/signin" className="text-brand">
            {t("nav.signin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
