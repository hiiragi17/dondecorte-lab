import Link from "next/link";
import {
  getLatestVideos,
  getRecentContent,
  getUpcomingLives,
  type RecentContentItem,
} from "@/lib/queries/top-page";
import type { ContentType } from "@/lib/types";
import type { Live } from "@/lib/types/live";
import type { Video } from "@/lib/types/video";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  video: "動画",
  live: "ライブ",
  radio: "ラジオ",
  article: "記事",
  tv_show: "TV",
  topic: "トピック",
};

const CONTENT_TYPE_PATH: Record<ContentType, string> = {
  video: "videos",
  live: "lives",
  radio: "radios",
  article: "articles",
  tv_show: "tv",
  topic: "topics",
};

const BUSINESS_TIMEZONE = "Asia/Tokyo";

function formatDate(value: string | null): string {
  if (!value) return "日付未定";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${Number(y)}年${Number(m)}月${Number(d)}日`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日付未定";
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  });
}

function formatTime(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TIMEZONE,
  });
}

export default async function Home() {
  const [upcomingLivesRes, latestVideosRes, recentContentRes] =
    await Promise.allSettled([
      getUpcomingLives(),
      getLatestVideos(),
      getRecentContent(),
    ]);

  const upcomingLives =
    upcomingLivesRes.status === "fulfilled" ? upcomingLivesRes.value : [];
  const latestVideos =
    latestVideosRes.status === "fulfilled" ? latestVideosRes.value : [];
  const recentContent =
    recentContentRes.status === "fulfilled" ? recentContentRes.value : [];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <section className="mb-10 md:mb-14">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          DonDecorte Lab
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん非公式ファンサイト
        </p>
      </section>

      <UpcomingLivesSection lives={upcomingLives} />
      <LatestVideosSection videos={latestVideos} />
      <RecentContentSection items={recentContent} />
    </div>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel = "一覧へ",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-lg font-semibold text-brand-cream md:text-xl">
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="text-xs text-brand-sky-light transition hover:text-brand-sky md:text-sm"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function UpcomingLivesSection({ lives }: { lives: Live[] }) {
  return (
    <section className="mb-10 md:mb-14">
      <SectionHeader title="直近のライブ予定" href="/lives" />
      {lives.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          予定されているライブはまだありません。
        </p>
      ) : (
        <ul className="space-y-3">
          {lives.map((live) => {
            const time = formatTime(live.start_time);
            return (
              <li key={live.id}>
                <Link
                  href={`/lives/${live.id}`}
                  className="block rounded-lg border-l-4 border-brand-sky border-y border-r border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light hover:bg-brand-card-dark/80"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-brand-sky-light">
                      {formatDate(live.event_date)}
                      {time ? ` ${time}` : ""}
                    </span>
                    {live.venue ? (
                      <span className="text-xs text-brand-muted">
                        {live.venue}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-brand-cream">
                    {live.title}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function LatestVideosSection({ videos }: { videos: Video[] }) {
  return (
    <section className="mb-10 md:mb-14">
      <SectionHeader title="最新動画" href="/videos" />
      {videos.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだ動画が登録されていません。
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {videos.map((video) => (
            <li key={video.id}>
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
                  <p className="mt-1 text-xs text-brand-muted">
                    {formatDate(video.published_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentContentSection({ items }: { items: RecentContentItem[] }) {
  return (
    <section className="mb-10 md:mb-14">
      <SectionHeader title="最近追加されたコンテンツ" />
      {items.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだコンテンツが登録されていません。
        </p>
      ) : (
        <ul className="divide-y divide-brand-border-dark overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link
                href={`/${CONTENT_TYPE_PATH[item.type]}/${item.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-bg-dark/40"
              >
                <span className="inline-flex shrink-0 items-center rounded-md border border-brand-border-dark bg-brand-bg-dark px-2 py-0.5 text-[10px] font-medium text-brand-sky-light">
                  {CONTENT_TYPE_LABEL[item.type]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-brand-cream">
                  {item.title}
                </span>
                <span className="shrink-0 text-xs text-brand-muted">
                  {formatDate(item.date)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
