import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-brand-bg-light px-4 py-12 text-brand-brown-dark">
      <h1 className="text-2xl font-bold">管理画面</h1>
      <p className="text-sm">ログイン中: {user?.email}</p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white hover:bg-brand-sky-dark"
        >
          ログアウト
        </button>
      </form>
    </main>
  );
}
