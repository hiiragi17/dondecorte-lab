import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoSection } from "@/components/features/memo/memo-section";
import { VideoForm } from "@/components/features/video/video-form";
import { updateVideo } from "@/lib/actions/videos";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import { getVideo } from "@/lib/queries/videos";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditVideoPage({ params }: Props) {
  const { id } = await params;
  const [video, artists, combos, units] = await Promise.all([
    getVideo(id, { includeUnapproved: true }),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!video) {
    notFound();
  }

  const action = updateVideo.bind(null, id);
  const formKey = `${video.id}:${video.casts
    .map((cast) => `${cast.type}:${cast.id}`)
    .sort()
    .join(",")}`;

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
          {video.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <VideoForm
          key={formKey}
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={video}
          initialCasts={video.casts}
          submitLabel="更新する"
        />
      </div>

      <MemoSection targetType="video" targetId={video.id} variant="admin" />
    </div>
  );
}
