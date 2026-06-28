import Link from "next/link";
import { MagazineDeleteButton } from "@/components/features/magazine/magazine-delete-button";
import { deleteMagazine } from "@/lib/actions/magazines";
import { listMagazines } from "@/lib/queries/magazines";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminMagazinesPage() {
  const magazines = await listMagazines();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">雑誌</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            雑誌掲載の情報を管理します。本文の転載は不可、リンクのみ。
          </p>
        </div>
        <Link
          href="/admin/magazines/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {magazines.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだ雑誌が登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">誌名</th>
                <th className="px-4 py-2 text-left font-medium">発売日</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {magazines.map((magazine) => (
                <tr key={magazine.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {magazine.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {magazine.magazine_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDate(magazine.published_on)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/magazines/${magazine.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteMagazine}>
                        <input type="hidden" name="id" value={magazine.id} />
                        <MagazineDeleteButton title={magazine.title} />
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
