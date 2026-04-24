import type { LiveWithCasts } from "@/lib/types/live";
import { LiveCard } from "./live-card";

const BUSINESS_TIMEZONE = "Asia/Tokyo";

function todayInBusinessTimezone(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function partition(
  lives: LiveWithCasts[],
  today: string
): { upcoming: LiveWithCasts[]; past: LiveWithCasts[] } {
  const upcoming: LiveWithCasts[] = [];
  const past: LiveWithCasts[] = [];
  for (const live of lives) {
    if (live.event_date && live.event_date >= today) {
      upcoming.push(live);
    } else {
      past.push(live);
    }
  }
  upcoming.sort((a, b) => {
    const dateDiff = (a.event_date ?? "").localeCompare(b.event_date ?? "");
    if (dateDiff !== 0) return dateDiff;
    if (a.start_time === b.start_time) return 0;
    if (!a.start_time) return 1;
    if (!b.start_time) return -1;
    return a.start_time.localeCompare(b.start_time);
  });
  return { upcoming, past };
}

export function LiveList({ lives }: { lives: LiveWithCasts[] }) {
  if (lives.length === 0) {
    return (
      <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
        まだライブが登録されていません。
      </p>
    );
  }

  const { upcoming, past } = partition(lives, todayInBusinessTimezone());

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-cream md:text-xl">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
            予定されているライブはまだありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((live) => (
              <li key={live.id}>
                <LiveCard live={live} variant="upcoming" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-cream md:text-xl">
          Past
        </h2>
        {past.length === 0 ? (
          <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
            過去のライブはありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {past.map((live) => (
              <li key={live.id}>
                <LiveCard live={live} variant="past" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
