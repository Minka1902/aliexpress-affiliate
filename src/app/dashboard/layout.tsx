import { cookies } from "next/headers";
import { requireUser, isAdminUser } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const theme = user.theme || cookieStore.get("theme")?.value || "aliexpress";
  const locale = user.locale || cookieStore.get("locale")?.value || "en";

  return (
    <div className="min-h-screen bg-page">
      <TopBar isAdmin={isAdminUser(user)} theme={theme} locale={locale} />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}
