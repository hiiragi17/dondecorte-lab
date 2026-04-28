import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MemoSection } from "@/components/features/memo/memo-section";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getLive as fetchLive } from "@/lib/queries/lives";
import type { CastEntry } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils/date";
import { normalizeExternalUrl } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

const getLive = cache(fetchLive);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

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
    </div>
  );
}
