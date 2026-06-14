"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload =
      mode === "signup"
        ? { name: form.get("name"), email: form.get("email"), password: form.get("password") }
        : { email: form.get("email"), password: form.get("password") };

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.error === "exists") setError(t("auth.exists"));
    else if (data.error === "invalid") setError(t("auth.invalid"));
    else if (data.error === "banned") setError(t("auth.banned"));
    else setError(t("common.error"));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-card p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-2xl font-extrabold text-brand">{t("app.name")}</div>
          <p className="text-sm text-ink-muted mt-1">{t("app.tagline")}</p>
        </div>
        <h1 className="text-lg font-semibold mb-4 text-ink">
          {mode === "signup" ? t("auth.signupTitle") : t("auth.signinTitle")}
        </h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input name="name" required placeholder={t("auth.name")} className="input" />
          )}
          <input name="email" type="email" required placeholder={t("auth.email")} className="input" />
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : 1}
            placeholder={t("auth.password")}
            className="input"
          />
          {error && <p className="text-sm text-brand">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-gradient text-white rounded-full py-2 font-medium disabled:opacity-60"
          >
            {mode === "signup" ? t("auth.signupCta") : t("auth.signinCta")}
          </button>
        </form>
        {mode === "signin" && (
          <p className="text-sm text-center mt-3">
            <Link href="/forgot" className="text-ink-muted hover:text-brand">
              {t("auth.forgot")}
            </Link>
          </p>
        )}
        <p className="text-sm text-ink-muted mt-4 text-center">
          {mode === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
          <Link href={mode === "signup" ? "/signin" : "/signup"} className="text-brand font-medium">
            {mode === "signup" ? t("nav.signin") : t("nav.signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}
