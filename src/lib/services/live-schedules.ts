import type { createClient } from "@/lib/supabase/server";
import {
  LIVE_SCHEDULE_PHASES,
  type LiveSchedulePhase,
  type LiveScheduleInput,
} from "@/lib/types/live";
import { isValidEventDate } from "./validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function isSchedulePhase(value: string): value is LiveSchedulePhase {
  return (LIVE_SCHEDULE_PHASES as readonly string[]).includes(value);
}

/**
 * live-form が送出する schedule_phase / schedule_label / schedule_start /
 * schedule_end / schedule_url / schedule_time の並列フィールドを
 * LiveScheduleInput[] に変換する。
 *
 * - 開始日が空の行はスキップ（未入力の追加行を無視するため）
 * - 種別不正・日付不正・期間逆転は呼び出し側に伝えるエラーとして返す
 */
export function parseLiveSchedules(formData: FormData): {
  schedules: LiveScheduleInput[];
  error?: string;
} {
  const phases = formData.getAll("schedule_phase").map((v) => String(v));
  const labels = formData.getAll("schedule_label").map((v) => String(v));
  const starts = formData.getAll("schedule_start").map((v) => String(v));
  const ends = formData.getAll("schedule_end").map((v) => String(v));
  const times = formData.getAll("schedule_time").map((v) => String(v));
  const urls = formData.getAll("schedule_url").map((v) => String(v));

  const schedules: LiveScheduleInput[] = [];

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i]?.trim();
    const start = starts[i]?.trim() ?? "";
    const end = ends[i]?.trim() ?? "";
    const timeInput = times[i]?.trim() ?? "";

    // 開始日が空の行は未入力とみなしスキップ。
    if (!start) continue;

    if (!phase || !isSchedulePhase(phase)) {
      return { schedules: [], error: "スケジュールの種別が不正です" };
    }
    if (!isValidEventDate(start)) {
      return { schedules: [], error: "スケジュールの開始日が不正です" };
    }
    if (end && !isValidEventDate(end)) {
      return { schedules: [], error: "スケジュールの終了日が不正です" };
    }
    if (end && end < start) {
      return {
        schedules: [],
        error: "スケジュールの終了日は開始日以降にしてください",
      };
    }

    const label = labels[i]?.trim() ?? "";
    const url = urls[i]?.trim() ?? "";

    schedules.push({
      phase_type: phase,
      label: label || null,
      start_date: start,
      end_date: end || null,
      start_time: timeInput ? `${start}T${timeInput}:00` : null,
      url: url || null,
      sort_order: schedules.length,
    });
  }

  return { schedules };
}

/**
 * 指定ライブのチケットスケジュールを全削除してから再挿入する（casts と同じ
 * 「置き換え」方式）。
 */
export async function replaceLiveSchedules(
  supabase: SupabaseServerClient,
  liveId: string,
  schedules: LiveScheduleInput[]
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from("live_schedules")
    .delete()
    .eq("live_id", liveId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  if (schedules.length === 0) return {};

  const rows = schedules.map((s) => ({
    live_id: liveId,
    phase_type: s.phase_type,
    label: s.label,
    start_date: s.start_date,
    end_date: s.end_date,
    start_time: s.start_time,
    url: s.url,
    sort_order: s.sort_order,
  }));

  const { error: insertError } = await supabase
    .from("live_schedules")
    .insert(rows);
  if (insertError) {
    return { error: insertError.message };
  }

  return {};
}
