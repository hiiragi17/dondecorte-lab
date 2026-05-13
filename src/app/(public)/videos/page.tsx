import type { Metadata } from "next";
import { VideoGrid } from "@/components/features/video/video-grid";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listAllPerformers } from "@/lib/queries/performers";
import { listVideos } from "@/lib/queries/videos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "動画",
  description: "ドンデコルテさん関連のYouTube動画一覧。",
  alternates: { canonical: "/videos" },
  openGraph: {
    title: "動画",
    description: "ドンデコルテさん関連のYouTube動画一覧。",
    url: "/videos",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function VideosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [videos, performers] = await Promise.all([
    listVideos({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          動画
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん関連のYouTube動画一覧。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      <VideoGrid videos={videos} />
    </div>
  );
}
