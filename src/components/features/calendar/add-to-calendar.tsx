import { buildGoogleCalendarUrl } from "@/lib/calendar/google-url";
import { buildLiveCalendarDescription } from "@/lib/calendar/live-event";
import { normalizeStartTimeForIcs } from "@/lib/ics/start-time";

type Props = {
  live: {
    id: string;
    title: string;
    event_date: string | null;
    start_time: string | null;
    venue: string | null;
    description: string | null;
    casts: { name: string }[];
  };
  siteUrl: string;
  className?: string;
};

const linkClass =
  "inline-flex items-center gap-1 rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-xs font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky";

export function AddToCalendar({ live, siteUrl, className }: Props) {
  if (!live.event_date) return null;

  const detailUrl = `${siteUrl}/lives/${live.id}`;
  const details = buildLiveCalendarDescription({
    description: live.description,
    casts: live.casts,
    detailUrl,
  });
  const googleUrl = buildGoogleCalendarUrl({
    title: live.title,
    date: live.event_date,
    startTime: normalizeStartTimeForIcs(live.start_time),
    location: live.venue,
    details,
  });
  const icsHref = `/lives/${live.id}/ics`;

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <a
        href={googleUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={linkClass}
      >
        Google カレンダーに追加 ↗
      </a>
      <a href={icsHref} download className={linkClass}>
        .ics で追加
      </a>
    </div>
  );
}
