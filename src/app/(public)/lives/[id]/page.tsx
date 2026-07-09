import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AddToCalendar } from "@/components/features/calendar/add-to-calendar";
import { MemoSection } from "@/components/features/memo/memo-section";
import { RelatedContents } from "@/components/features/related/related-contents";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getLive as fetchLive } from "@/lib/queries/lives";
import { getRelatedContents } from "@/lib/queries/related-contents";
import type { CastEntry } from "@/lib/types";
import { LIVE_SCHEDULE_PHASE_LABEL } from "@/lib/types/live";
import { formatDate, formatTime } from "@/lib/utils/date";
import { getSiteUrl } from "@/lib/utils/site-url";
import { normalizeExternalUrl } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

const getLive = cache(fetchLive);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;
const RELATED_LIMIT = 6;

function buildDescription(live: {
  description: string | null;
  casts: CastEntry[];
  title: string;
  venue: string | null;
}): string {
  const performerNames = live.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const venueText = live.venue ? `${live.venue}。` : "";
  const raw = (live.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}${venueText}ドンデコルテさん関連ライブ「${live.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${venueText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const live = await getLive(id);
  if (!live) return {};

  const description = buildDescription(live);
  const url = `/lives/${live.id}`;

  return {
    title: live.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: live.title,
      description,
      url,
    },
  };
}

export default async function LiveDetailPage({ params }: Props) {
  const { id } = await params;
  const live = await getLive(id);
  if (!live) notFound();

  const related = await getRelatedContents(
    live.casts,
    { type: "live", id: live.id },
    RELATED_LIMIT
  );
  const eventDate = formatDate(live.event_date);
  const startTime = formatTime(live.start_time);
  const safeUrl = normalizeExternalUrl(live.url);
  const description = live.description?.trim() ? live.description : null;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/lives"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← ライブ一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {live.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {eventDate ? (
          <span>
            {eventDate}
            {startTime ? ` ${startTime}` : ""}
          </span>
        ) : (
          <span>日付未定</span>
        )}
        {live.venue ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            {live.venue}
          </span>
        ) : null}
      </div>

      {live.casts.length > 0 ? (
        <div className="mt-4">
          <PerformerTagList performers={live.casts} />
        </div>
      ) : null}

      {live.event_date || live.schedules.length > 0 ? (
        <AddToCalendar
          live={live}
          siteUrl={getSiteUrl()}
          className="mt-6"
        />
      ) : null}

      {live.schedules.length > 0 ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <h2 className="mb-2 text-sm font-semibold text-brand-cream">
            チケットスケジュール
          </h2>
          <ul className="space-y-2">
            {live.schedules.map((schedule) => {
              // starts_at / ends_at（FANY 取得分）があれば時刻まで表示する。
              const startTime = schedule.starts_at
                ? formatTime(schedule.starts_at)
                : null;
              const startDate = formatDate(schedule.start_date);
              const start = startTime ? `${startDate} ${startTime}` : startDate;
              const endTime = schedule.ends_at
                ? formatTime(schedule.ends_at)
                : null;
              const endDate = schedule.end_date
                ? formatDate(schedule.end_date)
                : null;
              const end = endDate
                ? endTime
                  ? `${endDate} ${endTime}`
                  : endDate
                : null;
              const phaseLabel = LIVE_SCHEDULE_PHASE_LABEL[schedule.phase_type];
              const scheduleUrl = normalizeExternalUrl(schedule.url);
              return (
                <li
                  key={schedule.id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-brand-muted md:text-sm"
                >
                  <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-bg-dark px-1.5 py-0.5 text-brand-gold">
                    {schedule.label ?? `${phaseLabel}期間`}
                  </span>
                  <span className="text-brand-cream">
                    {start}
                    {end && end !== start ? ` 〜 ${end}` : ""}
                  </span>
                  {scheduleUrl ? (
                    <a
                      href={scheduleUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-brand-sky-light transition hover:text-brand-sky"
                    >
                      申込・購入 ↗
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {safeUrl ? (
        <div className="mt-6">
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            ライブ情報を見る ↗
          </a>
        </div>
      ) : null}

      {description ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {description}
          </p>
        </section>
      ) : null}

      <MemoSection targetType="live" targetId={live.id} />

      <RelatedContents contents={related} />
    </div>
  );
}
