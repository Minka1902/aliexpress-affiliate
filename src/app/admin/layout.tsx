import { requireAdmin } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-page">
      <TopBar isAdmin={true} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
