import Link from "next/link";
import type { CastEntry, CastType } from "@/lib/types";
import type { LiveWithCasts } from "@/lib/types/live";
import { formatDate } from "@/lib/utils/date";

const CAST_PATH: Record<CastType, string> = {
  artist: "/artists",
  comedy_group: "/combos",
  unit: "/units",
};

const BUSINESS_TIMEZONE = "Asia/Tokyo";

function formatTime(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TIMEZONE,
  });
}

function CastTag({ cast }: { cast: CastEntry }) {
  return (
    <Link
      href={`${CAST_PATH[cast.type]}/${cast.id}`}
      className="inline-flex items-center rounded-full border border-brand-border-dark bg-brand-bg-dark px-2 py-0.5 text-xs text-brand-gold transition hover:border-brand-sky-light hover:text-brand-sky-light"
    >
      {cast.name}
    </Link>
  );
}

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
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {live.casts.map((cast) => (
            <li key={`${cast.type}-${cast.id}`}>
              <CastTag cast={cast} />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
