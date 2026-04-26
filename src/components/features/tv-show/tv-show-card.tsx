import Link from "next/link";
import { PerformerTagList } from "@/components/shared/performer-tags";
import type { TvShowWithCasts } from "@/lib/types/tv-show";
import { formatDate, formatTime } from "@/lib/utils/date";

export function TvShowCard({ tvShow }: { tvShow: TvShowWithCasts }) {
  const airDate = formatDate(tvShow.air_date);
  const airTime = formatTime(tvShow.air_time);
  const dateLine = airDate
    ? `${airDate}${airTime ? ` ${airTime}` : ""}`
    : "放送日未定";

  return (
    <article className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light">
      <Link href={`/tv/${tvShow.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-brand-gold">
            {dateLine}
          </span>
          {tvShow.network ? (
            <span className="inline-flex items-center rounded border border-brand-sky/40 bg-brand-bg-dark px-1.5 py-0.5 text-[11px] text-brand-sky-light">
              {tvShow.network}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {tvShow.title}
        </p>
      </Link>
      {tvShow.casts.length > 0 ? (
        <div className="mt-2">
          <PerformerTagList performers={tvShow.casts} />
        </div>
      ) : null}
    </article>
  );
}
