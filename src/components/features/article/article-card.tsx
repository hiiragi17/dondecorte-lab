import Link from "next/link";
import { CastTagList } from "@/components/shared/cast-tag";
import type { ArticleWithCasts } from "@/lib/types/article";
import { formatDate } from "@/lib/utils/date";

export function ArticleCard({ article }: { article: ArticleWithCasts }) {
  const published = formatDate(article.published_at);

  return (
    <article className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light">
      <Link href={`/articles/${article.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {published ? (
            <span className="text-sm font-medium text-brand-gold">
              {published}
            </span>
          ) : null}
          {article.source ? (
            <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-bg-dark px-1.5 py-0.5 text-[11px] text-brand-muted">
              {article.source}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {article.title}
        </p>
      </Link>
      {article.url ? (
        <div className="mt-2">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center text-xs font-medium text-brand-sky-light transition hover:text-brand-sky"
          >
            出典元を開く ↗
          </a>
        </div>
      ) : null}
      {article.casts.length > 0 ? (
        <div className="mt-2">
          <CastTagList casts={article.casts} />
        </div>
      ) : null}
    </article>
  );
}
