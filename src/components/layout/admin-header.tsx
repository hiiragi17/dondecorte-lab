import { createClient } from "@/lib/supabase/server";
import { AdminSignOutButton } from "./admin-sign-out-button";

export async function AdminHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-brand-border-light bg-brand-card-light px-6 py-3">
      <div className="text-sm font-medium text-brand-brown-dark">
        DonDecorte Lab 管理画面
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
