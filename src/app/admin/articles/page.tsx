import Link from "next/link";
import { ArticleDeleteButton } from "@/components/features/article/article-delete-button";
import { deleteArticle } from "@/lib/actions/articles";
import { listArticles } from "@/lib/queries/articles";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminArticlesPage() {
  const articles = await listArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">記事</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            インタビュー・記事と出演者を管理します。
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {articles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだ記事が登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">媒体</th>
                <th className="px-4 py-2 text-left font-medium">公開日</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {article.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {article.source ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDate(article.published_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteArticle}>
                        <input type="hidden" name="id" value={article.id} />
                        <ArticleDeleteButton title={article.title} />
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
