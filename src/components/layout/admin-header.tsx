import { createClient } from "@/lib/supabase/server";
import { AdminMobileMenu } from "./admin-sidebar";
import { AdminSignOutButton } from "./admin-sign-out-button";

export async function AdminHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-brand-border-light bg-brand-card-light px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <AdminMobileMenu />
        <div className="text-sm font-medium text-brand-brown-dark">
          <span className="md:hidden">管理画面</span>
          <span className="hidden md:inline">DonDecorte Lab 管理画面</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user?.email ? (
          <span className="hidden text-xs text-brand-brown-light sm:inline">
            {user.email}
          </span>
        ) : null}
        <AdminSignOutButton />
      </div>
    </header>
  );
}
