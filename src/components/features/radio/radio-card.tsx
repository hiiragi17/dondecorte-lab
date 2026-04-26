import Link from "next/link";
import { CastTagList } from "@/components/shared/cast-tag";
import type { RadioWithCasts } from "@/lib/types/radio";
import { formatDate } from "@/lib/utils/date";

export function RadioCard({ radio }: { radio: RadioWithCasts }) {
  const published = formatDate(radio.published_at);

  return (
    <article className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light">
      <Link href={`/radios/${radio.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {published ? (
            <span className="text-sm font-medium text-brand-gold">
              {published}
            </span>
          ) : null}
          {radio.platform ? (
            <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-bg-dark px-1.5 py-0.5 text-[11px] text-brand-muted">
              {radio.platform}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {radio.title}
        </p>
      </Link>
      {radio.casts.length > 0 ? (
        <div className="mt-2">
          <CastTagList casts={radio.casts} />
        </div>
      ) : null}
    </article>
  );
}
