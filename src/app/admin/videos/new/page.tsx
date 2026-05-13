import Link from "next/link";
import { VideoForm } from "@/components/features/video/video-form";
import { createVideo } from "@/lib/actions/videos";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewVideoPage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/videos"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 動画一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          動画を新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <VideoForm
          action={createVideo}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
