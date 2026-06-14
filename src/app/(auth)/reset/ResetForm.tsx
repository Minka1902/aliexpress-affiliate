"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function ResetForm() {
  const t = useTranslations();
  const token = useSearchParams().get("token") || "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const newPassword = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else setError(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-4 text-ink">{t("auth.resetTitle")}</h1>
        {done ? (
          <p className="text-sm text-ink-muted">
            {t("auth.resetDone")}{" "}
            <Link href="/signin" className="text-brand">
              {t("nav.signin")}
            </Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder={t("auth.newPassword")}
              className="input"
            />
            {error && <p className="text-sm text-brand">{t("auth.resetInvalid")}</p>}
            <button disabled={loading || !token} className="btn-primary">
              {t("auth.resetCta")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
