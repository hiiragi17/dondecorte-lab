import Link from "next/link";
import { ArtistDeleteButton } from "@/components/features/artist/artist-delete-button";
import { deleteArtist } from "@/lib/actions/artists";
import { listArtists } from "@/lib/queries/artists";

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  const artists = await listArtists();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">芸人</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            芸人個人のマスタを管理します。
          </p>
        </div>
        <Link
          href="/admin/artists/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border-light bg-brand-card-light">
        {artists.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだ芸人が登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">名前</th>
                <th className="px-4 py-2 text-left font-medium">よみがな</th>
                <th className="px-4 py-2 text-left font-medium">デビュー年</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {artists.map((artist) => (
                <tr key={artist.id} className="hover:bg-brand-bg-light">
                  <td className="px-4 py-2 font-medium text-brand-brown-dark">
                    {artist.name}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {artist.kana_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {artist.debut_year ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/artists/${artist.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteArtist}>
                        <input type="hidden" name="id" value={artist.id} />
                        <ArtistDeleteButton name={artist.name} />
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

