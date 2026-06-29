import Link from "next/link";
import { MagazineForm } from "@/components/features/magazine/magazine-form";
import { createMagazine } from "@/lib/actions/magazines";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewMagazinePage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/magazines"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 雑誌一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          雑誌を新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <MagazineForm
          action={createMagazine}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
