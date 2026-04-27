import Image from "next/image";
import Link from "next/link";
import type { Video } from "@/lib/types/video";
import { formatDate } from "@/lib/utils/date";

function resolveThumbnailSrc(video: Video): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.youtube_video_id) {
    return `https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
  }
  return null;
}

export function VideoCard({ video }: { video: Video }) {
  const published = formatDate(video.published_at);
  const thumbnailSrc = resolveThumbnailSrc(video);

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group block overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark transition hover:border-brand-sky-light"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-brand-bg-dark">
        {thumbnailSrc ? (
          <Image
            src={thumbnailSrc}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">
            No Thumbnail
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-brand-cream group-hover:text-brand-sky-light">
          {video.title}
        </p>
        {published ? (
          <p className="mt-1 text-xs text-brand-muted">{published}</p>
        ) : null}
      </div>
    </Link>
  );
}
