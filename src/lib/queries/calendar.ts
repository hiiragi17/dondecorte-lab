import {
  buildCalendarEntries,
  type CalendarEntry,
  type SchedulePeriodInput,
  type TimelinePointInput,
} from "@/lib/calendar/entries";
import { listTimeline } from "@/lib/queries/timeline";
import { createClient } from "@/lib/supabase/server";
import type { LiveSchedulePhase } from "@/lib/types/live";
import { formatTime } from "@/lib/utils/date";

const CONTENT_HREF: Record<TimelinePointInput["type"], string> = {
  video: "/videos",
  live: "/lives",
  radio: "/radios",
  article: "/articles",
  tv_show: "/tv",
  topic: "/topics",
  cm: "/cms",
  magazine: "/magazines",
};

type ScheduleRow = {
  id: string;
  live_id: string;
  phase_type: LiveSchedulePhase;
  label: string | null;
  start_date: string;
  end_date: string | null;
  live: { id: string; title: string } | { id: string; title: string }[] | null;
};

/**
 * カレンダー表示用の全エントリ（各コンテンツの主たる日付 + チケットスケジュール）
 * を取得する。種別での絞り込みはクライアント側で行うため、ここでは全件返す。
 */
export async function listCalendarEntries(): Promise<CalendarEntry[]> {
  const supabase = await createClient();

  const [timeline, scheduleResult, liveTimeResult] = await Promise.all([
    listTimeline(),
    supabase
      .from("live_schedules")
      .select(
        "id, live_id, phase_type, label, start_date, end_date, live:lives(id, title)"
      )
      .order("start_date", { ascending: true }),
    // ライブの開演時刻は event_date とは別カラム。月表示で時刻を出すため取得する。
    supabase.from("lives").select("id, start_time"),
  ]);

  if (scheduleResult.error) {
    throw new Error(
      `チケットスケジュールの取得に失敗しました: ${scheduleResult.error.message}`
    );
  }
  if (liveTimeResult.error) {
    throw new Error(
      `ライブ開演時刻の取得に失敗しました: ${liveTimeResult.error.message}`
    );
  }

  const liveStartTimes = new Map<string, string | null>();
  for (const row of (liveTimeResult.data ?? []) as {
    id: string;
    start_time: string | null;
  }[]) {
    liveStartTimes.set(row.id, row.start_time);
  }

  const timelinePoints: TimelinePointInput[] = timeline.map((item) => ({
    type: item.type,
    id: item.id,
    title: item.title,
    date: item.date,
    href: `${CONTENT_HREF[item.type]}/${item.id}`,
    // ライブは開演時刻を明示的に渡す（タイムラインは event_date のみ供給するため）。
    ...(item.type === "live"
      ? { startTime: formatTime(liveStartTimes.get(item.id) ?? null) }
      : {}),
  }));

  const schedules: SchedulePeriodInput[] = (
    (scheduleResult.data ?? []) as ScheduleRow[]
  ).map((row) => {
    const live = Array.isArray(row.live) ? row.live[0] : row.live;
    return {
      id: row.id,
      liveId: row.live_id,
      phase: row.phase_type,
      label: row.label,
      liveTitle: live?.title ?? "（不明なライブ）",
      startDate: row.start_date,
      endDate: row.end_date,
    };
  });

  return buildCalendarEntries({ timeline: timelinePoints, schedules });
}
