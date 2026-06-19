import type { Metadata } from "next";
import Link from "next/link";
import { AddToCalendar } from "@/components/features/calendar/add-to-calendar";
import {
  buildMonthMatrix,
  formatYearMonth,
  parseYearMonth,
  shiftMonth,
  todayInTokyo,
} from "@/lib/calendar/month-grid";
import { listLivesForCalendar } from "@/lib/queries/lives";
import type { LiveWithCasts } from "@/lib/types/live";
import { formatDate, formatTime } from "@/lib/utils/date";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

const DESCRIPTION = "ドンデコルテさん関連のライブをカレンダーで確認できます。";
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const UPCOMING_LIMIT = 12;

export const metadata: Metadata = {
  title: "カレンダー",
  description: DESCRIPTION,
  alternates: { canonical: "/calendar" },
  openGraph: {
    title: "カレンダー",
    description: DESCRIPTION,
    url: "/calendar",
  },
};

type SearchParams = Promise<{ ym?: string | string[] }>;

function ymParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const today = todayInTokyo();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const { year, month } = parseYearMonth(
    ymParam(params.ym),
    todayYear,
    todayMonth
  );

  const lives = await listLivesForCalendar();
  const siteUrl = getSiteUrl();

  const byDate = new Map<string, LiveWithCasts[]>();
  for (const live of lives) {
    if (!live.event_date) continue;
    const bucket = byDate.get(live.event_date) ?? [];
    bucket.push(live);
    byDate.set(live.event_date, bucket);
  }

  const matrix = buildMonthMatrix(year, month, today);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const upcoming = lives
    .filter((live) => live.event_date && live.event_date >= today)
    .slice(0, UPCOMING_LIMIT);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          カレンダー
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          {DESCRIPTION}
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/calendar?ym=${formatYearMonth(prev.year, prev.month)}`}
          className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-sm text-brand-gold transition hover:text-brand-sky-light"
        >
          ← {prev.year}年{prev.month}月
        </Link>
        <h2 className="text-lg font-semibold text-brand-cream md:text-xl">
          {year}年{month}月
        </h2>
        <Link
          href={`/calendar?ym=${formatYearMonth(next.year, next.month)}`}
          className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-sm text-brand-gold transition hover:text-brand-sky-light"
        >
          {next.year}年{next.month}月 →
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border-dark">
        <div className="grid grid-cols-7 border-b border-brand-border-dark bg-brand-card-dark">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-1 py-2 text-center text-xs font-medium text-brand-gold"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {matrix.flat().map((cell) => {
            const dayLives = byDate.get(cell.date) ?? [];
            return (
              <div
                key={cell.date}
                className={`min-h-[84px] border-b border-r border-brand-border-dark p-1 last:border-r-0 ${
                  cell.inCurrentMonth
                    ? "bg-brand-bg-dark"
                    : "bg-brand-bg-dark/40"
                }`}
              >
                <div
                  className={`mb-1 text-right text-xs ${
                    cell.isToday
                      ? "font-bold text-brand-sky-light"
                      : cell.inCurrentMonth
                        ? "text-brand-gold"
                        : "text-brand-muted/60"
                  }`}
                >
                  {cell.day}
                </div>
                <ul className="space-y-1">
                  {dayLives.map((live) => (
                    <li key={live.id}>
                      <Link
                        href={`/lives/${live.id}`}
                        className="block truncate rounded bg-brand-sky-pale/10 px-1 py-0.5 text-[11px] leading-tight text-brand-sky-light transition hover:bg-brand-sky-pale/20"
                        title={live.title}
                      >
                        {formatTime(live.start_time)
                          ? `${formatTime(live.start_time)} `
                          : ""}
                        {live.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-cream">
            これからのライブ
          </h2>
          <a
            href="/lives.ics"
            className="text-xs text-brand-muted transition hover:text-brand-sky-light"
          >
            全ライブをカレンダー購読 (.ics)
          </a>
        </div>

        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark p-4 text-sm text-brand-muted">
            予定されているライブはまだありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((live) => (
              <li
                key={live.id}
                className="rounded-lg border border-brand-border-dark bg-brand-card-dark p-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-brand-muted">
                  <span className="text-brand-sky-light">
                    {formatDate(live.event_date)}
                    {formatTime(live.start_time)
                      ? ` ${formatTime(live.start_time)}`
                      : ""}
                  </span>
                  {live.venue ? <span>{live.venue}</span> : null}
                </div>
                <Link
                  href={`/lives/${live.id}`}
                  className="mt-1 block text-sm font-medium text-brand-cream transition hover:text-brand-sky-light"
                >
                  {live.title}
                </Link>
                <AddToCalendar live={live} siteUrl={siteUrl} className="mt-3" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
