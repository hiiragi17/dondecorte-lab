import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { TvShow, TvShowWithCasts } from "@/lib/types/tv-show";

type CastRow = {
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};

function mapCasts(rows: CastRow[] | null | undefined): CastEntry[] {
  return (rows ?? []).flatMap((c) => {
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
}

function toTvShowBase(row: Record<string, unknown>): TvShow {
  return {
    id: row.id as string,
    title: row.title as string,
    network: (row.network as string | null) ?? null,
    air_date: (row.air_date as string | null) ?? null,
    air_time: (row.air_time as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listTvShows(): Promise<TvShow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tv_shows")
    .select("*")
    .order("air_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`TV番組一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as TvShow[];
}

export async function listTvShowsWithCasts(): Promise<TvShowWithCasts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tv_shows")
    .select(
      `*,
       tv_show_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .order("air_date", { ascending: false, nullsFirst: false })
    .order("air_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`TV番組一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const casts = mapCasts(record.tv_show_casts as CastRow[] | null | undefined);
    return { ...toTvShowBase(record), casts };
  });
}

export async function getTvShow(id: string): Promise<TvShowWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tv_shows")
    .select(
      `*,
       tv_show_casts(
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
    throw new Error(`TV番組情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const record = data as Record<string, unknown>;
  const casts = mapCasts(record.tv_show_casts as CastRow[] | null | undefined);
  return { ...toTvShowBase(record), casts };
}
