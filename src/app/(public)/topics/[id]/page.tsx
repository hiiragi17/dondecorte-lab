import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { getTopic as fetchTopic } from "@/lib/queries/topics";
import type { CastEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getTopic = cache(fetchTopic);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(topic: {
  content: string | null;
  casts: CastEntry[];
  title: string;
  source: string | null;
}): string {
  const performerNames = topic.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const sourceText = topic.source ? `情報源: ${topic.source}。` : "";
  const raw = (topic.content ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}${sourceText}ドンデコルテさん関連トピック「${topic.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${sourceText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) return {};

  const description = buildDescription(topic);
  const url = `/topics/${topic.id}`;

  return {
    title: topic.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: topic.title,
      description,
      url,
    },
  };
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) notFound();

  const topicDate = formatDate(topic.topic_date);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/topics"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← トピック一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {topic.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {topicDate ? <span>{topicDate}</span> : null}
        {topic.source ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            情報源: {topic.source}
          </span>
        ) : null}
      </div>

      {topic.casts.length > 0 ? (
        <div className="mt-4">
          <PerformerTagList performers={topic.casts} />
        </div>
      ) : null}

      {topic.url ? (
        <div className="mt-6">
          <a
            href={topic.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            関連リンクを見る ↗
          </a>
        </div>
      ) : null}

      {topic.content ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {topic.content}
          </p>
        </section>
      ) : null}
    </div>
  );
}
