"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";

interface LibraryLink {
  id: string;
  sourceUrl: string;
  productId?: string;
  eligible: boolean;
  title?: string;
  imageUrl?: string;
  tags?: string[];
  note?: string;
  proxyUrl: string | null;
  createdAt: string;
}

interface LibraryResponse {
  links: LibraryLink[];
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function LibraryClient() {
  const t = useTranslations();
  const { toast } = useToast();
  const [links, setLinks] = useState<LibraryLink[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/library");
        if (!res.ok) throw new Error("failed");
        const json: LibraryResponse = await res.json();
        if (active) setLinks(json.links ?? []);
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

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast(t("toast.copied"));
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-ink">{t("nav.library")}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !links) {
    return <p className="text-ink-muted">{t("common.error")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-ink">{t("nav.library")}</h1>

      {links.length === 0 ? (
        <EmptyState
          icon="link"
          message={`${t("nav.library")} — 0`}
          ctaHref="/dashboard/link-generator"
          ctaLabel={t("nav.linkGenerator")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((l) => (
            <div key={l.id} className="card flex flex-col gap-3">
              <div className="flex gap-3">
                {l.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.imageUrl}
                    alt=""
                    className="w-20 h-20 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded bg-surface-2 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink line-clamp-2 break-words">
                    {l.title || l.sourceUrl}
                  </p>
                  <span
                    className={
                      "inline-block text-xs px-2 py-0.5 rounded mt-2 " +
                      (l.eligible
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700")
                    }
                  >
                    {l.eligible ? `✓ ${t("link.eligible")}` : `✕ ${t("link.notEligible")}`}
                  </span>
                </div>
              </div>

              {l.proxyUrl && (
                <div className="flex items-center gap-2">
                  <input readOnly value={l.proxyUrl} className="input text-xs flex-1" />
                  <button
                    onClick={() => copy(l.proxyUrl!, l.id)}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    {copied === l.id ? t("link.copied") : t("link.copy")}
                  </button>
                </div>
              )}

              <p className="text-xs text-ink-muted mt-auto">{formatDate(l.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
