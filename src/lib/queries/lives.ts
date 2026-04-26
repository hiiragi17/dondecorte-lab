import { createClient } from "@/lib/supabase/server";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
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

export async function listLives(): Promise<Live[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lives")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ライブ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Live[];
}

export async function listLivesWithCasts(): Promise<LiveWithCasts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lives")
    .select(
      `*,
       live_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("start_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ライブ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const casts = mapCasts(record.live_casts as CastRow[] | null | undefined);
    return { ...toLiveBase(record), casts };
  });
}

export async function getLive(id: string): Promise<LiveWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lives")
    .select(
      `*,
       live_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`ライブ情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const record = data as Record<string, unknown>;
  const casts = mapCasts(record.live_casts as CastRow[] | null | undefined);
  return { ...toLiveBase(record), casts };
}
