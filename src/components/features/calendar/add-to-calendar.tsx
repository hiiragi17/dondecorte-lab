import { buildLiveGoogleLinks, type LiveLinkInput } from "@/lib/calendar/live-links";

type Props = {
  live: LiveLinkInput;
  siteUrl: string;
  className?: string;
};

const linkClass =
  "inline-flex items-center gap-1 rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-xs font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky";

export function AddToCalendar({ live, siteUrl, className }: Props) {
  if (!live.event_date && (live.schedules ?? []).length === 0) return null;

  const googleLinks = buildLiveGoogleLinks(live, siteUrl);
  const hasMultiple = googleLinks.length > 1;
  const icsHref = `/lives/${live.id}/ics`;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {googleLinks.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noreferrer noopener"
          className={linkClass}
        >
          Google{hasMultiple ? `（${link.label}）` : " カレンダーに追加"} ↗
        </a>
      ))}
      <a href={icsHref} download className={linkClass}>
        .ics で追加（全日程）
      </a>
    </div>
  );
}
