import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MemoSection } from "@/components/features/memo/memo-section";
import { RelatedContents } from "@/components/features/related/related-contents";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getCm as fetchCm } from "@/lib/queries/cms";
import { getRelatedContents } from "@/lib/queries/related-contents";
import type { CastEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getCm = cache(fetchCm);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;
const RELATED_LIMIT = 6;

function buildDescription(cm: {
  description: string | null;
  casts: CastEntry[];
  title: string;
  advertiser: string | null;
}): string {
  const performerNames = cm.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const advertiserText = cm.advertiser ? `企業: ${cm.advertiser}。` : "";
  const raw = (cm.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}${advertiserText}ドンデコルテさん関連のCM「${cm.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${advertiserText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cm = await getCm(id);
  if (!cm) return {};

  const description = buildDescription(cm);
  const url = `/cms/${cm.id}`;

  return {
    title: cm.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: cm.title,
      description,
      url,
    },
  };
}

export default async function CmDetailPage({ params }: Props) {
  const { id } = await params;
  const cm = await getCm(id);
  if (!cm) notFound();

  const related = await getRelatedContents(
    cm.casts,
    { type: "cm", id: cm.id },
    RELATED_LIMIT
  );
  const airedOn = formatDate(cm.aired_on);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/cms"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← CM一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {cm.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {airedOn ? <span>{airedOn}</span> : null}
        {cm.advertiser ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            企業: {cm.advertiser}
          </span>
        ) : null}
        {cm.product ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            商品: {cm.product}
          </span>
        ) : null}
      </div>

      {cm.casts.length > 0 ? (
        <div className="mt-4">
          <PerformerTagList performers={cm.casts} />
        </div>
      ) : null}

      {cm.url ? (
        <div className="mt-6">
          <a
            href={cm.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            CMを見る ↗
          </a>
        </div>
      ) : null}

      {cm.description ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {cm.description}
          </p>
        </section>
      ) : null}

      <MemoSection targetType="cm" targetId={cm.id} />

      <RelatedContents contents={related} />
    </div>
  );
}
