import Link from "next/link";
import { LiveForm } from "@/components/features/live/live-form";
import { createLive } from "@/lib/actions/lives";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewLivePage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

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
          ライブを新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <LiveForm
          action={createLive}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
