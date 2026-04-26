import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CastTag } from "@/components/shared/cast-tag";
import { getArticle as fetchArticle } from "@/lib/queries/articles";
import type { CastEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getArticle = cache(fetchArticle);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(article: {
  casts: CastEntry[];
  title: string;
  source: string | null;
}): string {
  const performerNames = article.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const sourceText = article.source ? `出典: ${article.source}。` : "";
  const fallback = `${performerText}${sourceText}ドンデコルテさん関連記事「${article.title}」のリンク。`;
  if (fallback.length <= DESCRIPTION_MAX_LENGTH) return fallback;
  return `${fallback.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return {};

  const description = buildDescription(article);
  const url = `/articles/${article.id}`;

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      url,
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const published = formatDate(article.published_at);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/articles"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← 記事一覧
        </Link>
      </div>

      <h1 className="text-xl font-bold text-brand-cream md:text-2xl">
        {article.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted md:text-sm">
        {published ? <span>{published}</span> : null}
        {article.source ? (
          <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-1.5 py-0.5">
            出典: {article.source}
          </span>
        ) : null}
      </div>

      {article.casts.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {article.casts.map((cast) => (
            <CastTag key={`${cast.type}-${cast.id}`} cast={cast} />
          ))}
        </div>
      ) : null}

      {article.url ? (
        <div className="mt-6">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md border border-brand-border-dark bg-brand-card-dark px-4 py-2 text-sm font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            記事を読む ↗
          </a>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-brand-muted">
        ※ 著作権保護のため本文は転載せず、出典元へのリンクのみを掲載しています。
      </p>
    </div>
  );
}
