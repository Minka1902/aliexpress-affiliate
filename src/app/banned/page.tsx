import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icon";

export default async function BannedPage() {
  const t = await getTranslations();
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="max-w-md text-center card flex flex-col items-center">
        <Icon name="ban" size={40} className="text-brand mb-3" />
        <h1 className="text-xl font-semibold text-ink">{t("banned.title")}</h1>
        <p className="text-ink-muted mt-2">{t("banned.body")}</p>
        <form action="/api/auth/signout" method="post" className="mt-4">
          <a href="/signin" className="text-brand text-sm">
            {t("nav.signin")}
          </a>
        </form>
      </div>
    </div>
  );
}
