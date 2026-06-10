import { cookies } from "next/headers";
import { requireUser, isAdminUser } from "@/lib/auth";
import { entitlements } from "@/lib/roles";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { EntitlementsProvider } from "@/components/EntitlementsProvider";
import { SeedModeProvider } from "@/components/SeedModeProvider";
import { ClipboardWatcher } from "@/components/ClipboardWatcher";
import { Onboarding } from "@/components/Onboarding";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const theme = user.theme || cookieStore.get("theme")?.value || "aliexpress";
  const locale = user.locale || cookieStore.get("locale")?.value || "en";
  const features = entitlements(user);

  return (
    <EntitlementsProvider value={features}>
      <SeedModeProvider>
        <div className="min-h-screen bg-page">
          <TopBar isAdmin={isAdminUser(user)} theme={theme} locale={locale} features={features} />
          <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
          <BottomNav features={features} />
          <ClipboardWatcher />
          {!user.onboardedAt && <Onboarding theme={theme} locale={locale} />}
        </div>
      </SeedModeProvider>
    </EntitlementsProvider>
  );
}
