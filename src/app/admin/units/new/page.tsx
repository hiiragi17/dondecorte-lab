import Link from "next/link";
import { UnitForm } from "@/components/features/unit/unit-form";
import { createUnit } from "@/lib/actions/units";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";

export const dynamic = "force-dynamic";

export default async function NewUnitPage() {
  const [artists, combos] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
  ]);

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
          ユニットを新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <UnitForm
          action={createUnit}
          artists={artists}
          combos={combos}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
