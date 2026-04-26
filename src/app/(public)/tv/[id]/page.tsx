import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getTvShow as fetchTvShow } from "@/lib/queries/tv-shows";
import type { CastEntry } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getTvShow = cache(fetchTvShow);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(tvShow: {
  description: string | null;
  casts: CastEntry[];
  title: string;
  network: string | null;
}): string {
  const performerNames = tvShow.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const networkText = tvShow.network ? `${tvShow.network}。` : "";
  const raw = (tvShow.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}${networkText}ドンデコルテさん関連TV番組「${tvShow.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${networkText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tvShow = await getTvShow(id);
  if (!tvShow) return {};

  const description = buildDescription(tvShow);
  const url = `/tv/${tvShow.id}`;

  return {
    title: tvShow.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: tvShow.title,
      description,
      url,
    },
  };
}

export default async function TvDetailPage({ params }: Props) {
  const { id } = await params;
  const tvShow = await getTvShow(id);
  if (!tvShow) notFound();

  const airDate = formatDate(tvShow.air_date);
  const airTime = formatTime(tvShow.air_time);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/tv"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← TV一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {tvShow.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {airDate ? (
          <span>
            {airDate}
            {airTime ? ` ${airTime}` : ""}
          </span>
        ) : (
          <span>放送日未定</span>
        )}
        {tvShow.network ? (
          <span className="inline-flex items-center rounded border border-brand-sky/40 bg-brand-card-dark px-1.5 py-0.5 text-brand-sky-light">
            {tvShow.network}
          </span>
        ) : null}
      </div>

      {tvShow.casts.length > 0 ? (
        <div className="mt-4">
          <PerformerTagList performers={tvShow.casts} />
        </div>
      ) : null}

      {tvShow.url ? (
        <div className="mt-6">
          <a
            href={tvShow.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            番組情報を見る ↗
          </a>
        </div>
      ) : null}

      {tvShow.description ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {tvShow.description}
          </p>
        </section>
      ) : null}
    </div>
  );
}
