import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { entitlements } from "@/lib/roles";
import { TopBar } from "@/components/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const cookieStore = await cookies();
  const theme = user.theme || cookieStore.get("theme")?.value || "aliexpress";
  const locale = user.locale || cookieStore.get("locale")?.value || "en";

  return (
    <div className="min-h-screen bg-page">
      <TopBar isAdmin={true} theme={theme} locale={locale} features={entitlements(user)} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
