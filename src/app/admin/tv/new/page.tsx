import Link from "next/link";
import { TvShowForm } from "@/components/features/tv-show/tv-show-form";
import { createTvShow } from "@/lib/actions/tv-shows";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewTvPage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tv"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← テレビ一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          テレビ番組を新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <TvShowForm
          action={createTvShow}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
