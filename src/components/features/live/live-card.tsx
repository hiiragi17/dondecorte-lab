import Link from "next/link";
import { PerformerTagList } from "@/components/shared/performer-tags";
import type { LiveWithCasts } from "@/lib/types/live";
import { formatDate, formatTime } from "@/lib/utils/date";

export function LiveCard({
  live,
  variant,
}: {
  live: LiveWithCasts;
  variant: "upcoming" | "past";
}) {
  const eventDate = formatDate(live.event_date);
  const startTime = formatTime(live.start_time);
  const dateLine = eventDate
    ? `${eventDate}${startTime ? ` ${startTime}` : ""}`
    : "日付未定";

  const borderClass =
    variant === "upcoming"
      ? "border-l-4 border-brand-sky border-y border-r border-brand-border-dark"
      : "border border-brand-border-dark";
  const dateColor =
    variant === "upcoming" ? "text-brand-sky-light" : "text-brand-gold";

  return (
    <article
      className={`rounded-lg ${borderClass} bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light`}
    >
      <Link href={`/lives/${live.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-sm font-medium ${dateColor}`}>{dateLine}</span>
          {live.venue ? (
            <span className="text-xs text-brand-muted">{live.venue}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {live.title}
        </p>
      </Link>
      {live.casts.length > 0 ? (
        <div className="mt-2">
          <PerformerTagList performers={live.casts} />
        </div>
      ) : null}
    </article>
  );
}
