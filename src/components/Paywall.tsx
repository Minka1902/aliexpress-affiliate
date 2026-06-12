"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";

export function Paywall({ title }: { title?: string }) {
  const t = useTranslations();
  return (
    <div className="card text-center py-12 flex flex-col items-center gap-3">
      <Icon name="lock" size={40} className="text-ink-muted" />
      <p className="text-ink font-medium">{title ?? t("pay.locked")}</p>
      <Link href="/dashboard/pay" className="btn-primary">
        {t("pay.goUnlock")}
      </Link>
    </div>
  );
}
