import { AdminSidebar } from "@/components/admin/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-3 p-3 md:flex-row md:gap-4 md:p-6">
        <AdminSidebar />
        <main className="glass min-w-0 flex-1 overflow-visible rounded-2xl p-3 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
