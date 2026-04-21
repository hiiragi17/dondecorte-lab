import Link from "next/link";
import type { Video } from "@/lib/types/video";

const BUSINESS_TIMEZONE = "Asia/Tokyo";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${Number(y)}年${Number(m)}月${Number(d)}日`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  });
}

export function VideoCard({ video }: { video: Video }) {
  const published = formatDate(video.published_at);

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group block overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark transition hover:border-brand-sky-light"
    >
      <div className="aspect-video w-full overflow-hidden bg-brand-bg-dark">
        {video.thumbnail_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={video.thumbnail_url}
            alt=""
            loading="lazy"
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
