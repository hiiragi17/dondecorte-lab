import Link from "next/link";
import { CmDeleteButton } from "@/components/features/cm/cm-delete-button";
import { deleteCm } from "@/lib/actions/cms";
import { listCms } from "@/lib/queries/cms";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default async function AdminCmsPage() {
  const cms = await listCms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">CM</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            CM・広告案件の出演情報を管理します。
          </p>
        </div>
        <Link
          href="/admin/cms/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {cms.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだCMが登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">企業・ブランド</th>
                <th className="px-4 py-2 text-left font-medium">放送・公開日</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {cms.map((cm) => (
                <tr key={cm.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {cm.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {cm.advertiser ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDate(cm.aired_on)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/cms/${cm.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteCm}>
                        <input type="hidden" name="id" value={cm.id} />
                        <CmDeleteButton title={cm.title} />
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
