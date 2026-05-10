import Link from "next/link";
import { ComboDeleteButton } from "@/components/features/combo/combo-delete-button";
import { deleteCombo } from "@/lib/actions/combos";
import { listCombos } from "@/lib/queries/combos";

export const dynamic = "force-dynamic";

const GROUP_TYPE_LABELS: Record<string, string> = {
  combo: "コンビ",
  trio: "トリオ",
  quartet: "カルテット",
  other: "その他",
};

export default async function AdminCombosPage() {
  const combos = await listCombos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">コンビ</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            コンビ・トリオなど恒常的なグループを管理します。
          </p>
        </div>
        <Link
          href="/admin/combos/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {combos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだコンビが登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">名前</th>
                <th className="px-4 py-2 text-left font-medium">よみがな</th>
                <th className="px-4 py-2 text-left font-medium">種別</th>
                <th className="px-4 py-2 text-left font-medium">結成年</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {combos.map((combo) => (
                <tr key={combo.id} className="hover:bg-brand-bg-light">
                  <td className="px-4 py-2 font-medium text-brand-brown-dark">
                    {combo.name}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {combo.kana_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {GROUP_TYPE_LABELS[combo.group_type] ?? combo.group_type}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {combo.formed_year ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/combos/${combo.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteCombo}>
                        <input type="hidden" name="id" value={combo.id} />
                        <ComboDeleteButton name={combo.name} />
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
