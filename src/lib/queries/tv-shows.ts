import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { TvShow, TvShowWithCasts } from "@/lib/types/tv-show";

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

export async function listTvShows(
  options: ListOptions = {}
): Promise<TvShow[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(
      supabase,
      "tv_show",
      options.performer
    );
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("tv_shows")
    .select("*")
    .order("air_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`TV番組一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as TvShow[];
}

export async function listTvShowsWithCasts(
  options: ListOptions = {}
): Promise<TvShowWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(
      supabase,
      "tv_show",
      options.performer
    );
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("tv_shows")
    .select("*")
    .order("air_date", { ascending, nullsFirst: false })
    .order("air_time", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`TV番組一覧の取得に失敗しました: ${error.message}`);
  }

  const tvShows = (data ?? []).map((row) =>
    toTvShowBase(row as Record<string, unknown>)
  );
  const castsByContent = await fetchCastsByContent(
    supabase,
    "tv_show",
    tvShows.map((t) => t.id)
  );

  return tvShows.map((tvShow) => ({
    ...tvShow,
    casts: castsByContent.get(tvShow.id) ?? [],
  }));
}

export async function getTvShow(id: string): Promise<TvShowWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tv_shows")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`TV番組情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "tv_show", [id]);
  return {
    ...toTvShowBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
