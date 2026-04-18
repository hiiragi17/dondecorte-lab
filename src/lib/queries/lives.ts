import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { Live, LiveWithCasts } from "@/lib/types/live";

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

  type CastRow = {
    artist_id: string | null;
    comedy_group_id: string | null;
    unit_id: string | null;
    artist: { id: string; name: string } | null;
    comedy_group: { id: string; name: string } | null;
    unit: { id: string; name: string } | null;
  };

  const rawCasts = (data as Record<string, unknown>).live_casts as CastRow[];

  const casts: CastEntry[] = (rawCasts ?? []).flatMap((c) => {
    if (c.artist_id && c.artist) {
      return [{ type: "artist" as const, id: c.artist.id, name: c.artist.name }];
    }
    if (c.comedy_group_id && c.comedy_group) {
      return [{ type: "comedy_group" as const, id: c.comedy_group.id, name: c.comedy_group.name }];
    }
    if (c.unit_id && c.unit) {
      return [{ type: "unit" as const, id: c.unit.id, name: c.unit.name }];
    }
    return [];
  });

  const liveBase: Live = {
    id: (data as { id: string }).id,
    title: (data as { title: string }).title,
    event_date: (data as { event_date: string | null }).event_date,
    start_time: (data as { start_time: string | null }).start_time,
    venue: (data as { venue: string | null }).venue,
    description: (data as { description: string | null }).description,
    url: (data as { url: string | null }).url,
    is_notified: (data as { is_notified: boolean }).is_notified,
    created_at: (data as { created_at: string }).created_at,
    updated_at: (data as { updated_at: string }).updated_at,
  };

  return { ...liveBase, casts };
}
