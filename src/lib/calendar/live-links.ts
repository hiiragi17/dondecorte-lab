import type { CalendarCategory } from "@/lib/calendar/categories";
import { buildGoogleCalendarUrl } from "@/lib/calendar/google-url";
import { buildLiveCalendarDescription } from "@/lib/calendar/live-event";
import { normalizeStartTimeForIcs } from "@/lib/ics/start-time";
import { LIVE_SCHEDULE_PHASE_LABEL } from "@/lib/types/live";

export type LiveLinkInput = {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  description: string | null;
  casts: { name: string }[];
  schedules?: {
    id: string;
    phase_type: "lottery" | "sale";
    label: string | null;
    start_date: string;
    end_date: string | null;
  }[];
};

export type GoogleCalendarLink = {
  key: string;
  /** ボタンに出すラベル（例: 本編 / 抽選期間 / 販売期間）。 */
  label: string;
  category: CalendarCategory;
  url: string;
};

/**
 * ライブの「本編（当日）」と各チケットスケジュール（抽選・販売期間）について
 * Google カレンダーのテンプレート URL を組み立てる。期間は終日の帯として登録する。
 */
export function buildLiveGoogleLinks(
  live: LiveLinkInput,
  siteUrl: string
): GoogleCalendarLink[] {
  const detailUrl = `${siteUrl}/lives/${live.id}`;
  const details = buildLiveCalendarDescription({
    description: live.description,
    casts: live.casts,
    detailUrl,
  });

  const links: GoogleCalendarLink[] = [];

  if (live.event_date) {
    links.push({
      key: "event",
      label: "本編",
      category: "event",
      url: buildGoogleCalendarUrl({
        title: live.title,
        date: live.event_date,
        startTime: normalizeStartTimeForIcs(live.start_time),
        location: live.venue,
        details,
      }),
    });
  }

  for (const s of live.schedules ?? []) {
    const phaseLabel = LIVE_SCHEDULE_PHASE_LABEL[s.phase_type];
    const label = s.label ?? `${phaseLabel}期間`;
    links.push({
      key: `schedule-${s.id}`,
      label,
      category: s.phase_type,
      url: buildGoogleCalendarUrl({
        title: `${live.title}（${label}）`,
        date: s.start_date,
        startTime: null,
        endDate: s.end_date,
        details: detailUrl,
      }),
    });
  }

  return links;
}
