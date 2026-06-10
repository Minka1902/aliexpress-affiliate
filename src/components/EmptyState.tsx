import Link from "next/link";

export function EmptyState({
  icon = "🗂️",
  message,
  ctaHref,
  ctaLabel,
}: {
  icon?: string;
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card text-center py-12 flex flex-col items-center gap-3">
      <div className="text-4xl">{icon}</div>
      <p className="text-ink-muted">{message}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn-primary">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
