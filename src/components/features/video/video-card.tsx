import Image from "next/image";
import Link from "next/link";
import type { Video } from "@/lib/types/video";
import { formatDate } from "@/lib/utils/date";

// next.config.ts の images.remotePatterns で許可しているホストのみ。
// ここに無いホストの URL を next/image に渡すと実行時エラーになるため、
// 許可外の thumbnail_url は youtube_video_id 由来の URL にフォールバックする。
const YOUTUBE_THUMBNAIL_HOSTS = new Set(["img.youtube.com", "i.ytimg.com"]);

function isAllowedThumbnailUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      YOUTUBE_THUMBNAIL_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function resolveThumbnailSrc(video: Video): string | null {
  if (video.thumbnail_url && isAllowedThumbnailUrl(video.thumbnail_url)) {
    return video.thumbnail_url;
  }
  if (video.youtube_video_id) {
    return `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
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
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <VideoThumbnailPlaceholder title={video.title} />
        )}
      </div>
      <div className="px-[14px] py-3">
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

function VideoThumbnailPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F0DFC8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.4 }}
        aria-hidden="true"
      >
        <polygon points="6 4 20 12 6 20 6 4" />
      </svg>
      <p
        className="max-w-full truncate text-[11px] text-brand-cream"
        style={{ opacity: 0.35 }}
      >
        {title}
      </p>
    </div>
  );
}
