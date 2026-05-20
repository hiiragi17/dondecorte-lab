import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Live, LiveWithCasts } from "@/lib/types/live";

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
  const castsByContent = await fetchCastsByContent(
    supabase,
    "live",
    lives.map((l) => l.id)
  );

  return lives.map((live) => ({
    ...live,
    casts: castsByContent.get(live.id) ?? [],
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
  const castsByContent = await fetchCastsByContent(
    supabase,
    "live",
    lives.map((l) => l.id)
  );

  return lives.map((live) => ({
    ...live,
    casts: castsByContent.get(live.id) ?? [],
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

  const castsByContent = await fetchCastsByContent(supabase, "live", [id]);
  return {
    ...toLiveBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
