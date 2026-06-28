import Link from "next/link";
import { CmForm } from "@/components/features/cm/cm-form";
import { createCm } from "@/lib/actions/cms";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewCmPage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/cms"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← CM一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          CMを新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <CmForm
          action={createCm}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
