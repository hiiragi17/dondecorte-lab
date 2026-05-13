import Link from "next/link";
import { notFound } from "next/navigation";
import { UnitForm } from "@/components/features/unit/unit-form";
import { updateUnit } from "@/lib/actions/units";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { getUnit } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditUnitPage({ params }: Props) {
  const { id } = await params;
  const [unit, artists, combos] = await Promise.all([
    getUnit(id),
    listArtistSummaries(),
    listComboSummaries(),
  ]);

  if (!unit) {
    notFound();
  }

  const action = updateUnit.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/units"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← ユニット一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {unit.name} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <UnitForm
          action={action}
          artists={artists}
          combos={combos}
          initialValues={unit}
          initialMembers={unit.members}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
