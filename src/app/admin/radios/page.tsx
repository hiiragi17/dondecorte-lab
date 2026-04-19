import Link from "next/link";
import { RadioDeleteButton } from "@/components/features/radio/radio-delete-button";
import { deleteRadio } from "@/lib/actions/radios";
import { listRadios } from "@/lib/queries/radios";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminRadiosPage() {
  const radios = await listRadios();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">ラジオ</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            ラジオと出演者を管理します。
          </p>
        </div>
        <Link
          href="/admin/radios/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border-light bg-brand-card-light">
        {radios.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだラジオが登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">プラットフォーム</th>
                <th className="px-4 py-2 text-left font-medium">公開日</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {radios.map((radio) => (
                <tr key={radio.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {radio.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {radio.platform ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDate(radio.published_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/radios/${radio.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteRadio}>
                        <input type="hidden" name="id" value={radio.id} />
                        <RadioDeleteButton title={radio.title} />
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
