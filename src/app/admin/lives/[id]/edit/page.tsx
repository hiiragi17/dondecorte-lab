import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveForm } from "@/components/features/live/live-form";
import { updateLive } from "@/lib/actions/lives";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import { getLive } from "@/lib/queries/lives";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditLivePage({ params }: Props) {
  const { id } = await params;
  const [live, artists, combos, units] = await Promise.all([
    getLive(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!live) {
    notFound();
  }

  const action = updateLive.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/lives"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← ライブ一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {live.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <LiveForm
          key={live.id}
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={live}
          initialCasts={live.casts}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
