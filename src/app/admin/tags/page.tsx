import Link from "next/link";
import { TagDeleteButton } from "@/components/features/tag/tag-delete-button";
import { deleteTag } from "@/lib/actions/tags";
import { listTags } from "@/lib/queries/tags";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await listTags();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">タグ</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            動画・ライブ・記事などコンテンツ横断のタグを管理します。
          </p>
        </div>
        <Link
          href="/admin/tags/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border-light bg-brand-card-light">
        {tags.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだタグが登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タグ名</th>
                <th className="px-4 py-2 text-left font-medium">スラッグ</th>
                <th className="px-4 py-2 text-left font-medium">色</th>
                <th className="px-4 py-2 text-left font-medium">紐付け数</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-brand-bg-light">
                  <td className="px-4 py-2 font-medium text-brand-brown-dark">
                    {tag.name}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-brand-brown-light">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {tag.color ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded border border-brand-border-light"
                          style={{ backgroundColor: tag.color }}
                          aria-hidden="true"
                        />
                        <span className="font-mono text-xs">{tag.color}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {tag.taggings_count}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/tags/${tag.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteTag}>
                        <input type="hidden" name="id" value={tag.id} />
                        <TagDeleteButton name={tag.name} />
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
