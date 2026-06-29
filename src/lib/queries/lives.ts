import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Live, LiveSchedule, LiveWithCasts } from "@/lib/types/live";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function toLiveBase(row: Record<string, unknown>): Live {
  return {
    id: row.id as string,
    title: row.title as string,
    event_date: (row.event_date as string | null) ?? null,
    start_time: (row.start_time as string | null) ?? null,
    venue: (row.venue as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    is_notified: row.is_notified as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toLiveSchedule(row: Record<string, unknown>): LiveSchedule {
  return {
    id: row.id as string,
    live_id: row.live_id as string,
    phase_type: row.phase_type as LiveSchedule["phase_type"],
    label: (row.label as string | null) ?? null,
    start_date: row.start_date as string,
    end_date: (row.end_date as string | null) ?? null,
    start_time: (row.start_time as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    sort_order: (row.sort_order as number | null) ?? 0,
  };
}

/**
 * 指定したライブ ID 群のチケットスケジュールを live_id ごとにまとめて返す。
 * 期間の開始日・表示順で並べる。
 */
export async function fetchSchedulesByLive(
  supabase: SupabaseServerClient,
  liveIds: string[]
): Promise<Map<string, LiveSchedule[]>> {
  const result = new Map<string, LiveSchedule[]>();
  if (liveIds.length === 0) return result;

  const { data, error } = await supabase
    .from("live_schedules")
    .select("*")
    .in("live_id", liveIds)
    .order("start_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`チケットスケジュールの取得に失敗しました: ${error.message}`);
  }

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const schedule = toLiveSchedule(row);
    const bucket = result.get(schedule.live_id) ?? [];
    bucket.push(schedule);
    result.set(schedule.live_id, bucket);
  }
  return result;
}

export async function listLives(options: ListOptions = {}): Promise<Live[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "live", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("lives")
    .select("*")
    .order("event_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`ライブ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Live[];
}

export async function listLivesWithCasts(
  options: ListOptions = {}
): Promise<LiveWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "live", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("lives")
    .select("*")
    .order("event_date", { ascending, nullsFirst: false })
    .order("start_time", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`ライブ一覧の取得に失敗しました: ${error.message}`);
  }

  const lives = (data ?? []).map((row) => toLiveBase(row as Record<string, unknown>));
  const ids = lives.map((l) => l.id);
  const [castsByContent, schedulesByLive] = await Promise.all([
    fetchCastsByContent(supabase, "live", ids),
    fetchSchedulesByLive(supabase, ids),
  ]);

  return lives.map((live) => ({
    ...live,
    casts: castsByContent.get(live.id) ?? [],
    schedules: schedulesByLive.get(live.id) ?? [],
  }));
}

export async function listLivesForCalendar(): Promise<LiveWithCasts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lives")
    .select("*")
    .not("event_date", "is", null)
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`ライブ一覧の取得に失敗しました: ${error.message}`);
  }

  const lives = (data ?? []).map((row) =>
    toLiveBase(row as Record<string, unknown>)
  );
  const ids = lives.map((l) => l.id);
  const [castsByContent, schedulesByLive] = await Promise.all([
    fetchCastsByContent(supabase, "live", ids),
    fetchSchedulesByLive(supabase, ids),
  ]);

  return lives.map((live) => ({
    ...live,
    casts: castsByContent.get(live.id) ?? [],
    schedules: schedulesByLive.get(live.id) ?? [],
  }));
}

export async function getLive(id: string): Promise<LiveWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lives")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`ライブ情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const [castsByContent, schedulesByLive] = await Promise.all([
    fetchCastsByContent(supabase, "live", [id]),
    fetchSchedulesByLive(supabase, [id]),
  ]);
  return {
    ...toLiveBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
    schedules: schedulesByLive.get(id) ?? [],
  };
}
