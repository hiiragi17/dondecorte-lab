import Link from "next/link";
import { TopicDeleteButton } from "@/components/features/topic/topic-delete-button";
import { deleteTopic } from "@/lib/actions/topics";
import { listTopics } from "@/lib/queries/topics";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminTopicsPage() {
  const topics = await listTopics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">トピック</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            写真撮影会・X投稿・CM情報等の雑多な情報を管理します。
          </p>
        </div>
        <Link
          href="/admin/topics/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {topics.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだトピックが登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">情報源</th>
                <th className="px-4 py-2 text-left font-medium">日付</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {topics.map((topic) => (
                <tr key={topic.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {topic.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {topic.source ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDate(topic.topic_date)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/topics/${topic.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteTopic}>
                        <input type="hidden" name="id" value={topic.id} />
                        <TopicDeleteButton title={topic.title} />
                      </form>
                    </div>
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
