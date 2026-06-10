"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Paywall({ title }: { title?: string }) {
  const t = useTranslations();
  return (
    <div className="card text-center py-12 flex flex-col items-center gap-3">
      <div className="text-4xl">🔒</div>
      <p className="text-ink font-medium">{title ?? t("pay.locked")}</p>
      <Link href="/dashboard/pay" className="btn-primary">
        {t("pay.goUnlock")}
      </Link>
    </div>
  );
}
