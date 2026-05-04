import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MemoSection } from "@/components/features/memo/memo-section";
import { RelatedContents } from "@/components/features/related/related-contents";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getRadio as fetchRadio } from "@/lib/queries/radios";
import { getRelatedContents } from "@/lib/queries/related-contents";
import type { CastEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getRadio = cache(fetchRadio);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;
const RELATED_LIMIT = 6;

function buildDescription(radio: {
  description: string | null;
  casts: CastEntry[];
  title: string;
}): string {
  const performerNames = radio.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const raw = (radio.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}ドンデコルテさん関連ラジオ「${radio.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const radio = await getRadio(id);
  if (!radio) return {};

  const description = buildDescription(radio);
  const url = `/radios/${radio.id}`;

  return {
    title: radio.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: radio.title,
      description,
      url,
    },
  };
}

export default async function RadioDetailPage({ params }: Props) {
  const { id } = await params;
  const radio = await getRadio(id);
  if (!radio) notFound();

  const published = formatDate(radio.published_at);
  const related = await getRelatedContents(
    "radio",
    radio.id,
    radio.casts,
    RELATED_LIMIT
  );

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/radios"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← ラジオ一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {radio.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {published ? <span>{published}</span> : null}
        {radio.platform ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            {radio.platform}
          </span>
        ) : null}
      </div>

      {radio.casts.length > 0 ? (
        <div className="mt-4">
          <PerformerTagList performers={radio.casts} />
        </div>
      ) : null}

      {radio.url ? (
        <div className="mt-6">
          <a
            href={radio.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            ラジオを聴く ↗
          </a>
        </div>
      ) : null}

      {radio.description ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {radio.description}
          </p>
        </section>
      ) : null}

      <MemoSection targetType="radio" targetId={radio.id} />

      <RelatedContents
        videos={related.videos}
        lives={related.lives}
        radios={related.radios}
        tvShows={related.tvShows}
        articles={related.articles}
        topics={related.topics}
      />
    </div>
  );
}
