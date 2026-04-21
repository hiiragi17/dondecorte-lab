import { VideoGrid } from "@/components/features/video/video-grid";
import { listVideos } from "@/lib/queries/videos";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const videos = await listVideos();

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

      <VideoGrid videos={videos} />
    </div>
  );
}
