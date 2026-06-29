import {
  ALL_DAY_LIVE_REMINDERS,
  buildLiveCalendarDescription,
  TIMED_LIVE_REMINDERS,
} from "@/lib/calendar/live-event";
import { normalizeStartTimeForIcs } from "@/lib/ics/start-time";
import type { IcsEvent } from "@/lib/ics/builder";
import { LIVE_SCHEDULE_PHASE_LABEL } from "@/lib/types/live";
import type { LiveWithCasts } from "@/lib/types/live";

/**
 * 1 つのライブを、当日（本編）＋各チケットスケジュール（抽選・販売期間）の
 * 複数 VEVENT に展開する。期間は終日の帯（endDate 付き）として出力する。
 */
export function buildLiveIcsEvents(
  live: LiveWithCasts,
  opts: { siteUrl: string; host: string }
): IcsEvent[] {
  const detailUrl = `${opts.siteUrl}/lives/${live.id}`;
  const description = buildLiveCalendarDescription({
    description: live.description,
    casts: live.casts,
    detailUrl,
  });

  const events: IcsEvent[] = [];

  if (live.event_date) {
    const startTime = normalizeStartTimeForIcs(live.start_time);
    events.push({
      uid: `live-${live.id}@${opts.host}`,
      date: live.event_date,
      startTime,
      summary: live.title,
      location: live.venue,
      description,
      url: live.url,
      reminders: startTime ? TIMED_LIVE_REMINDERS : ALL_DAY_LIVE_REMINDERS,
    });
  }

  for (const s of live.schedules) {
    const phaseLabel = LIVE_SCHEDULE_PHASE_LABEL[s.phase_type];
    const label = s.label ?? `${phaseLabel}期間`;
    events.push({
      uid: `live-${live.id}-schedule-${s.id}@${opts.host}`,
      date: s.start_date,
      startTime: null,
      endDate: s.end_date,
      summary: `${live.title}（${label}）`,
      description: detailUrl,
      url: s.url ?? live.url,
      reminders: ALL_DAY_LIVE_REMINDERS,
    });
  }

  return events;
}
