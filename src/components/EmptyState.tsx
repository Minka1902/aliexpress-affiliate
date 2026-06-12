import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

export function EmptyState({
  icon = "box",
  message,
  ctaHref,
  ctaLabel,
}: {
  icon?: IconName;
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card text-center py-12 flex flex-col items-center gap-3">
      <Icon name={icon} size={40} className="text-ink-muted" />
      <p className="text-ink-muted">{message}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn-primary">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
