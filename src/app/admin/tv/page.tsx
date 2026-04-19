import Link from "next/link";
import { TvShowDeleteButton } from "@/components/features/tv-show/tv-show-delete-button";
import { deleteTvShow } from "@/lib/actions/tv-shows";
import { listTvShows } from "@/lib/queries/tv-shows";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminTvPage() {
  const tvShows = await listTvShows();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">テレビ</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            テレビ番組と出演者を管理します。
          </p>
        </div>
        <Link
          href="/admin/tv/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border-light bg-brand-card-light">
        {tvShows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだTV番組が登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">放送局</th>
                <th className="px-4 py-2 text-left font-medium">放送日</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {tvShows.map((tvShow) => (
                <tr key={tvShow.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {tvShow.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {tvShow.network ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDate(tvShow.air_date)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/tv/${tvShow.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteTvShow}>
                        <input type="hidden" name="id" value={tvShow.id} />
                        <TvShowDeleteButton title={tvShow.title} />
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
