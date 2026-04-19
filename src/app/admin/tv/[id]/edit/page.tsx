import Link from "next/link";
import { notFound } from "next/navigation";
import { TvShowForm } from "@/components/features/tv-show/tv-show-form";
import { updateTvShow } from "@/lib/actions/tv-shows";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import { getTvShow } from "@/lib/queries/tv-shows";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTvPage({ params }: Props) {
  const { id } = await params;
  const [tvShow, artists, combos, units] = await Promise.all([
    getTvShow(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!tvShow) {
    notFound();
  }

  const action = updateTvShow.bind(null, id);

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
          {tvShow.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <TvShowForm
          key={tvShow.id}
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={tvShow}
          initialCasts={tvShow.casts}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
