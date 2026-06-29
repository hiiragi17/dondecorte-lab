import {
  CONTENT_TYPE_TO_CATEGORY,
  LIVE_PHASE_CATEGORY,
  type CalendarCategory,
} from "@/lib/calendar/categories";
import type { ContentType } from "@/lib/types";
import {
  LIVE_SCHEDULE_PHASE_LABEL,
  type LiveSchedulePhase,
} from "@/lib/types/live";

export type CalendarEntry = {
  /** 一意キー（種別 + 元レコード id）。 */
  key: string;
  category: CalendarCategory;
  title: string;
  /** YYYY-MM-DD（Asia/Tokyo）。 */
  startDate: string;
  /** 期間の終了日（含む）。単日なら null。 */
  endDate: string | null;
  /** HH:MM。なければ null（終日扱い）。 */
  startTime: string | null;
  /** 詳細ページへのリンク。 */
  href: string;
};

const TOKYO_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * date / timestamptz いずれの文字列も Asia/Tokyo の YYYY-MM-DD に正規化する。
 * 既に YYYY-MM-DD ならそのまま返す。
 */
export function tokyoDateOf(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // en-CA は YYYY-MM-DD 形式。
  return TOKYO_DATE_FMT.format(date);
}

function tokyoTimeOf(value: string | null): string | null {
  if (!value) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hh = parts.find((p) => p.type === "hour")?.value;
  const mm = parts.find((p) => p.type === "minute")?.value;
  if (!hh || !mm) return null;
  return `${hh}:${mm}`;
}

export type TimelinePointInput = {
  type: ContentType;
  id: string;
  title: string;
  /** 主たる日付（date or timestamptz）。null は除外される。 */
  date: string | null;
  href: string;
};

export type SchedulePeriodInput = {
  id: string;
  liveId: string;
  phase: LiveSchedulePhase;
  label: string | null;
  liveTitle: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
};

/**
 * タイムラインの点イベントと、ライブのチケットスケジュール（期間）を
 * 単一の CalendarEntry[] にまとめる純粋関数。
 */
export function buildCalendarEntries(args: {
  timeline: TimelinePointInput[];
  schedules: SchedulePeriodInput[];
}): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const item of args.timeline) {
    if (!item.date) continue;
    const startDate = tokyoDateOf(item.date);
    if (!startDate) continue;
    entries.push({
      key: `${item.type}-${item.id}`,
      category: CONTENT_TYPE_TO_CATEGORY[item.type],
      title: item.title,
      startDate,
      endDate: null,
      // live は時刻を別途持つため timeline 側では終日扱い。
      startTime: tokyoTimeOf(
        /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? null : item.date
      ),
      href: item.href,
    });
  }

  for (const s of args.schedules) {
    const startDate = tokyoDateOf(s.startDate);
    if (!startDate) continue;
    const phaseLabel = LIVE_SCHEDULE_PHASE_LABEL[s.phase];
    const title = s.label
      ? `${s.liveTitle}（${s.label}）`
      : `${s.liveTitle}（${phaseLabel}）`;
    entries.push({
      key: `schedule-${s.id}`,
      category: LIVE_PHASE_CATEGORY[s.phase],
      title,
      startDate,
      endDate: s.endDate ? tokyoDateOf(s.endDate) : null,
      startTime: tokyoTimeOf(s.startTime),
      href: `/lives/${s.liveId}`,
    });
  }

  return entries;
}
