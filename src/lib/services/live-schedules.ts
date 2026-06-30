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
 * schedule_end / schedule_url の並列フィールドを LiveScheduleInput[] に変換する。
 *
 * 抽選 / 販売は「期間（開始日〜終了日）」として扱い、時刻は持たない。
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
  const urls = formData.getAll("schedule_url").map((v) => String(v));

  const schedules: LiveScheduleInput[] = [];

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i]?.trim();
    const start = starts[i]?.trim() ?? "";
    const end = ends[i]?.trim() ?? "";

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
      url: url || null,
      sort_order: schedules.length,
    });
  }

  return { schedules };
}

function toRows(liveId: string, schedules: LiveScheduleInput[]) {
  return schedules.map((s) => ({
    live_id: liveId,
    phase_type: s.phase_type,
    label: s.label,
    start_date: s.start_date,
    end_date: s.end_date,
    url: s.url,
    sort_order: s.sort_order,
  }));
}

/**
 * 指定ライブのチケットスケジュールを全削除してから再挿入する（casts と同じ
 * 「置き換え」方式）。delete と insert は別クエリで原子的ではないため、
 * insert 失敗時は削除した既存行を復元する明示的ロールバックを行い、
 * スケジュールが消えたままにならないようにする。
 */
export async function replaceLiveSchedules(
  supabase: SupabaseServerClient,
  liveId: string,
  schedules: LiveScheduleInput[]
): Promise<{ error?: string }> {
  // ロールバック用に既存行を退避（insert 失敗時に復元する）。
  const { data: existing, error: fetchError } = await supabase
    .from("live_schedules")
    .select("live_id, phase_type, label, start_date, end_date, url, sort_order")
    .eq("live_id", liveId);
  if (fetchError) {
    return { error: fetchError.message };
  }

  const { error: deleteError } = await supabase
    .from("live_schedules")
    .delete()
    .eq("live_id", liveId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  if (schedules.length === 0) return {};

  const { error: insertError } = await supabase
    .from("live_schedules")
    .insert(toRows(liveId, schedules));
  if (insertError) {
    // 削除済みの既存行を復元（ベストエフォート）。
    if (existing && existing.length > 0) {
      await supabase.from("live_schedules").insert(existing);
    }
    return { error: insertError.message };
  }

  return {};
}
