import Link from "next/link";
import { ContentTypeBadge } from "@/components/shared/content-type-badge";
import {
  getLatestVideos,
  getRecentContent,
  getUpcomingLives,
  type RecentContentItem,
} from "@/lib/queries/top-page";
import type { Live } from "@/lib/types/live";
import type { Video } from "@/lib/types/video";
import {
  formatDate as formatDateRaw,
  formatTime,
} from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_PATH: Record<RecentContentItem["type"], string> = {
  video: "videos",
  live: "lives",
  radio: "radios",
  article: "articles",
  tv_show: "tv",
  topic: "topics",
};

function formatDate(value: string | null): string {
  return formatDateRaw(value) ?? "日付未定";
}

const MONTH_LABEL_JA = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function splitEventDate(
  value: string | null
): { day: string; month: string } | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, , m, d] = match;
  const monthIndex = Number(m) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return { day: String(Number(d)), month: MONTH_LABEL_JA[monthIndex] };
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
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-5">
      <section className="mb-8 border-b border-brand-border-dark pt-10 pb-8 sm:mb-10 sm:pt-14 sm:pb-12">
        <h1 className="text-2xl font-bold text-brand-cream sm:text-3xl">
          DonDecorte Lab
        </h1>
        <p
          className="mt-[10px] text-sm text-brand-gold"
          style={{ letterSpacing: "0.2px" }}
        >
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
      <h2 className="text-base font-semibold text-brand-cream md:text-lg">
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
            const dateParts = splitEventDate(live.event_date);
            return (
              <li key={live.id}>
                <Link
                  href={`/lives/${live.id}`}
                  className="flex items-center gap-4 rounded-lg border-y border-r border-l-4 border-brand-border-dark border-l-brand-sky bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light hover:border-l-brand-sky-light hover:bg-brand-card-dark/80"
                >
                  <div className="w-[72px] shrink-0 text-center">
                    {dateParts ? (
                      <>
                        <div
                          className="text-2xl font-bold leading-none text-brand-cream"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {dateParts.day}
                        </div>
                        <div className="mt-1 text-[13px] text-brand-gold">
                          {dateParts.month}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-brand-muted">日付未定</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {time ? (
                        <span className="text-sm font-medium text-brand-sky-light">
                          {time}
                        </span>
                      ) : null}
                      {live.venue ? (
                        <span className="text-xs text-brand-muted">
                          {live.venue}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-brand-cream">
                      {live.title}
                    </p>
                  </div>
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
        <ul className="grid grid-cols-2 gap-[14px] md:grid-cols-3">
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
                    <VideoThumbnailPlaceholder title={video.title} />
                  )}
                </div>
                <div className="px-[14px] py-3">
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
                <ContentTypeBadge type={item.type} />
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
