import { cookies } from "next/headers";
import { requireUser, isAdminUser } from "@/lib/auth";
import { entitlements } from "@/lib/roles";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { EntitlementsProvider } from "@/components/EntitlementsProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const theme = user.theme || cookieStore.get("theme")?.value || "aliexpress";
  const locale = user.locale || cookieStore.get("locale")?.value || "en";
  const features = entitlements(user);

  return (
    <EntitlementsProvider value={features}>
      <div className="min-h-screen bg-page">
        <TopBar isAdmin={isAdminUser(user)} theme={theme} locale={locale} features={features} />
        <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
        <BottomNav features={features} />
      </div>
    </EntitlementsProvider>
  );
}
