import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.status === "APPROVED") redirect("/dashboard");
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="max-w-md text-center card">
        <div className="text-4xl mb-3">⏳</div>
        <h1 className="text-xl font-semibold text-ink">{t("pending.title")}</h1>
        <p className="text-ink-muted mt-2">{t("pending.body")}</p>
        <form action="/api/auth/signout" method="post" className="mt-4">
          <a href="/signin" className="text-brand text-sm">
            {t("nav.signin")}
          </a>
        </form>
      </div>
    </div>
  );
}
