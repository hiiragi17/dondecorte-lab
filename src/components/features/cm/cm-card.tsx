import Link from "next/link";
import { PerformerTagList } from "@/components/shared/performer-tags";
import type { CmWithCasts } from "@/lib/types/cm";
import { formatDate } from "@/lib/utils/date";

export function CmCard({ cm }: { cm: CmWithCasts }) {
  const airedOn = formatDate(cm.aired_on);

  return (
    <article className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light">
      <Link href={`/cms/${cm.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {airedOn ? (
            <span className="text-sm font-medium text-brand-gold">
              {airedOn}
            </span>
          ) : null}
          {cm.advertiser ? (
            <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-bg-dark px-1.5 py-0.5 text-[11px] text-brand-muted">
              {cm.advertiser}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {cm.title}
        </p>
        {cm.product ? (
          <p className="mt-0.5 text-xs text-brand-muted">{cm.product}</p>
        ) : null}
      </Link>
      {cm.url ? (
        <div className="mt-2">
          <a
            href={cm.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center text-xs font-medium text-brand-sky-light transition hover:text-brand-sky"
          >
            CMを見る ↗
          </a>
        </div>
      ) : null}
      {cm.casts.length > 0 ? (
        <div className="mt-2">
          <PerformerTagList performers={cm.casts} />
        </div>
      ) : null}
    </article>
  );
}
