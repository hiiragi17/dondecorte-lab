"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddToCalendar } from "@/components/features/calendar/add-to-calendar";
import {
  CALENDAR_CATEGORIES,
  CALENDAR_CATEGORY_CLASS,
  CALENDAR_CATEGORY_LABEL,
  type CalendarCategory,
} from "@/lib/calendar/categories";
import type { CalendarEntry } from "@/lib/calendar/entries";
import {
  buildMonthMatrix,
  shiftMonth,
} from "@/lib/calendar/month-grid";
import type { LiveWithCasts } from "@/lib/types/live";
import { formatDate, formatTime } from "@/lib/utils/date";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const UPCOMING_LIMIT = 12;

type Props = {
  entries: CalendarEntry[];
  lives: LiveWithCasts[];
  siteUrl: string;
  today: string;
  initialYear: number;
  initialMonth: number;
};

function withinRange(date: string, entry: CalendarEntry): boolean {
  const end = entry.endDate ?? entry.startDate;
  return entry.startDate <= date && date <= end;
}

export function CalendarView({
  entries,
  lives,
  siteUrl,
  today,
  initialYear,
  initialMonth,
}: Props) {
  const [{ year, month }, setYm] = useState({
    year: initialYear,
    month: initialMonth,
  });
  const [selected, setSelected] = useState<Set<CalendarCategory>>(
    () => new Set(CALENDAR_CATEGORIES)
  );

  const visibleEntries = useMemo(
    () => entries.filter((e) => selected.has(e.category)),
    [entries, selected]
  );

  const matrix = useMemo(
    () => buildMonthMatrix(year, month, today),
    [year, month, today]
  );

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const upcoming = useMemo(
    () =>
      lives
        .filter((live) => live.event_date && live.event_date >= today)
        .slice(0, UPCOMING_LIMIT),
    [lives, today]
  );

  function toggle(category: CalendarCategory) {
    setSelected((prevSet) => {
      const nextSet = new Set(prevSet);
      if (nextSet.has(category)) {
        nextSet.delete(category);
      } else {
        nextSet.add(category);
      }
      return nextSet;
    });
  }

  const allSelected = selected.size === CALENDAR_CATEGORIES.length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYm(prev)}
          className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-sm text-brand-gold transition hover:text-brand-sky-light"
        >
          ← {prev.year}年{prev.month}月
        </button>
        <h2 className="text-lg font-semibold text-brand-cream md:text-xl">
          {year}年{month}月
        </h2>
        <button
          type="button"
          onClick={() => setYm(next)}
          className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-sm text-brand-gold transition hover:text-brand-sky-light"
        >
          {next.year}年{next.month}月 →
        </button>
      </div>

      {/* 種別フィルタ */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setSelected(
              allSelected ? new Set() : new Set(CALENDAR_CATEGORIES)
            )
          }
          className="rounded-full border border-brand-border-dark bg-brand-card-dark px-3 py-1 text-xs text-brand-gold transition hover:text-brand-sky-light"
        >
          {allSelected ? "すべて解除" : "すべて選択"}
        </button>
        {CALENDAR_CATEGORIES.map((category) => {
          const active = selected.has(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(category)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? CALENDAR_CATEGORY_CLASS[category]
                  : "border-brand-border-dark bg-brand-bg-dark text-brand-muted/60"
              }`}
            >
              {CALENDAR_CATEGORY_LABEL[category]}
            </button>
          );
        })}
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
            const dayEntries = visibleEntries.filter((e) =>
              withinRange(cell.date, e)
            );
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
                  {dayEntries.map((entry) => (
                    <li key={entry.key}>
                      <Link
                        href={entry.href}
                        title={entry.title}
                        className={`block truncate rounded border px-1 py-0.5 text-[11px] leading-tight transition hover:opacity-80 ${CALENDAR_CATEGORY_CLASS[entry.category]}`}
                      >
                        {entry.startTime ? `${entry.startTime} ` : ""}
                        {entry.title}
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
