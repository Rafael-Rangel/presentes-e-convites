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
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 md:flex-row md:p-6">
        <AdminSidebar />
        <main className="glass flex-1 rounded-2xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
