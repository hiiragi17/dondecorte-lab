import { TestPushButton } from "@/components/features/push/test-push-button";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP");
}

export default async function AdminNotificationsPage() {
  const { data, error } = await adminClient
    .from("push_subscriptions")
    .select("id, user_agent, created_at, last_seen_at")
    .order("last_seen_at", { ascending: false });
  if (error) {
    throw new Error(`購読端末の取得に失敗しました: ${error.message}`);
  }
  const subscriptions = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-brown-dark">通知</h1>
        <p className="mt-1 text-sm text-brand-brown-light">
          Web Push の購読端末を確認し、テスト通知を送信します。
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-brand-border-light bg-brand-card-light p-4">
        <h2 className="text-sm font-medium text-brand-brown-dark">
          テスト送信
        </h2>
        <p className="text-xs text-brand-brown-light">
          登録済みの全端末にテスト通知を送ります。
        </p>
        <TestPushButton />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-brand-brown-dark">
          購読端末（{subscriptions.length}）
        </h2>
        <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
          {subscriptions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
              まだ購読端末がありません。公開サイトのフッターから通知をオンにしてください。
            </p>
          ) : (
            <table className="min-w-full divide-y divide-brand-border-light text-sm">
              <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">端末</th>
                  <th className="px-4 py-2 text-left font-medium">登録日時</th>
                  <th className="px-4 py-2 text-left font-medium">最終確認</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-light">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-brand-bg-light">
                    <td className="max-w-md truncate px-4 py-2 text-brand-brown-dark">
                      {sub.user_agent ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-brand-brown-light">
                      {formatDateTime(sub.created_at)}
                    </td>
                    <td className="px-4 py-2 text-brand-brown-light">
                      {formatDateTime(sub.last_seen_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
