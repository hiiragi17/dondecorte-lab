import Link from "next/link";
import { UnitDeleteButton } from "@/components/features/unit/unit-delete-button";
import { deleteUnit } from "@/lib/actions/units";
import { listUnits } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function AdminUnitsPage() {
  const units = await listUnits();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">ユニット</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            複数コンビ・個人が集まったユニットを管理します。
          </p>
        </div>
        <Link
          href="/admin/units/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border-light bg-brand-card-light">
        {units.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだユニットが登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">名前</th>
                <th className="px-4 py-2 text-left font-medium">説明</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-brand-bg-light">
                  <td className="px-4 py-2 font-medium text-brand-brown-dark">
                    {unit.name}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-brand-brown-light">
                    {unit.description ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/units/${unit.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteUnit}>
                        <input type="hidden" name="id" value={unit.id} />
                        <UnitDeleteButton name={unit.name} />
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
