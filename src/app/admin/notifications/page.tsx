import { TestPushButton } from "@/components/features/push/test-push-button";
import { listPushSubscriptions } from "@/lib/queries/push";
import { BUSINESS_TIMEZONE } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TIMEZONE,
  });
}

export default async function AdminNotificationsPage() {
  const subscriptions = await listPushSubscriptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-brown-dark">通知</h1>
        <p className="mt-1 text-sm text-brand-brown-light">
          Web Push の購読端末一覧と、テスト通知の送信を行います。
        </p>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light px-4 py-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">
          テスト通知
        </h2>
        <p className="mt-1 mb-3 text-xs text-brand-brown-light">
          下のボタンを押すと、登録されている全端末へテスト通知を送信します。
        </p>
        <TestPushButton />
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        <div className="border-b border-brand-border-light px-4 py-3">
          <h2 className="text-sm font-semibold text-brand-brown-dark">
            購読端末（{subscriptions.length} 件）
          </h2>
        </div>
        {subscriptions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだ購読している端末がありません。
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
                  <td className="max-w-xs px-4 py-2 text-brand-brown-dark">
                    <span className="block truncate" title={sub.user_agent ?? ""}>
                      {sub.user_agent ?? "不明な端末"}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-brand-brown-light">
                    {formatDateTime(sub.created_at)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-brand-brown-light">
                    {formatDateTime(sub.last_seen_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
