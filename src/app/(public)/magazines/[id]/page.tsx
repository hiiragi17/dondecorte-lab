import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MemoSection } from "@/components/features/memo/memo-section";
import { RelatedContents } from "@/components/features/related/related-contents";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getMagazine as fetchMagazine } from "@/lib/queries/magazines";
import { getRelatedContents } from "@/lib/queries/related-contents";
import type { CastEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getMagazine = cache(fetchMagazine);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;
const RELATED_LIMIT = 6;

function buildDescription(magazine: {
  description: string | null;
  casts: CastEntry[];
  title: string;
  magazine_name: string | null;
}): string {
  const performerNames = magazine.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const sourceText = magazine.magazine_name
    ? `掲載誌: ${magazine.magazine_name}。`
    : "";
  const raw = (magazine.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}${sourceText}ドンデコルテさん関連の雑誌掲載「${magazine.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${sourceText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const magazine = await getMagazine(id);
  if (!magazine) return {};

  const description = buildDescription(magazine);
  const url = `/magazines/${magazine.id}`;

  return {
    title: magazine.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: magazine.title,
      description,
      url,
    },
  };
}

export default async function MagazineDetailPage({ params }: Props) {
  const { id } = await params;
  const magazine = await getMagazine(id);
  if (!magazine) notFound();

  const related = await getRelatedContents(
    magazine.casts,
    { type: "magazine", id: magazine.id },
    RELATED_LIMIT
  );
  const publishedOn = formatDate(magazine.published_on);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/magazines"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← 雑誌一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {magazine.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {publishedOn ? <span>{publishedOn}</span> : null}
        {magazine.magazine_name ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            {magazine.magazine_name}
            {magazine.issue ? ` ${magazine.issue}` : ""}
          </span>
        ) : null}
        {magazine.publisher ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            {magazine.publisher}
          </span>
        ) : null}
      </div>

      {magazine.casts.length > 0 ? (
        <div className="mt-4">
          <PerformerTagList performers={magazine.casts} />
        </div>
      ) : null}

      {magazine.url ? (
        <div className="mt-6">
          <a
            href={magazine.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            詳細を見る ↗
          </a>
        </div>
      ) : null}

      {magazine.description ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {magazine.description}
          </p>
        </section>
      ) : null}

      <MemoSection targetType="magazine" targetId={magazine.id} />

      <RelatedContents contents={related} />
    </div>
  );
}
