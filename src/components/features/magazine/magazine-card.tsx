import Link from "next/link";
import { PerformerTagList } from "@/components/shared/performer-tags";
import type { MagazineWithCasts } from "@/lib/types/magazine";
import { formatDate } from "@/lib/utils/date";

export function MagazineCard({ magazine }: { magazine: MagazineWithCasts }) {
  const publishedOn = formatDate(magazine.published_on);
  const sourceLabel = [magazine.magazine_name, magazine.issue]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light">
      <Link href={`/magazines/${magazine.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {publishedOn ? (
            <span className="text-sm font-medium text-brand-gold">
              {publishedOn}
            </span>
          ) : null}
          {sourceLabel ? (
            <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-bg-dark px-1.5 py-0.5 text-[11px] text-brand-muted">
              {sourceLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {magazine.title}
        </p>
      </Link>
      {magazine.url ? (
        <div className="mt-2">
          <a
            href={magazine.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center text-xs font-medium text-brand-sky-light transition hover:text-brand-sky"
          >
            詳細を見る ↗
          </a>
        </div>
      ) : null}
      {magazine.casts.length > 0 ? (
        <div className="mt-2">
          <PerformerTagList performers={magazine.casts} />
        </div>
      ) : null}
    </article>
  );
}
