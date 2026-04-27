import { createClient } from "@/lib/supabase/server";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import type { ArticleWithCasts } from "@/lib/types/article";
import type { LiveWithCasts } from "@/lib/types/live";
import type { RadioWithCasts } from "@/lib/types/radio";
import type { TvShowWithCasts } from "@/lib/types/tv-show";
import type { VideoWithCasts } from "@/lib/types/video";

export type PerformerField =
  | "artist_id"
  | "comedy_group_id"
  | "unit_id";

export type PerformerContents = {
  videos: VideoWithCasts[];
  lives: LiveWithCasts[];
  radios: RadioWithCasts[];
  articles: ArticleWithCasts[];
  tvShows: TvShowWithCasts[];
};

const CAST_SUBSELECT = `
  id,
  artist_id,
  comedy_group_id,
  unit_id,
  artist:artists(id, name),
  comedy_group:comedy_groups(id, name),
  unit:units(id, name)
`;

type Row = Record<string, unknown>;
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function castsOf(record: Row, key: string) {
  return mapCasts(record[key] as CastRow[] | null | undefined);
}

async function listMatchingIds<K extends string>(
  supabase: SupabaseClient,
  castTable:
    | "video_casts"
    | "live_casts"
    | "radio_casts"
    | "article_casts"
    | "tv_show_casts",
  parentIdField: K,
  field: PerformerField,
  id: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from(castTable)
    .select(parentIdField)
    .eq(field, id);

  if (error) {
    throw new Error(`出演コンテンツの取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<K, string>>).map(
    (row) => row[parentIdField]
  );
}

export async function getPerformerContents(
  field: PerformerField,
  id: string
): Promise<PerformerContents> {
  const supabase = await createClient();

  const [videoIds, liveIds, radioIds, articleIds, tvShowIds] =
    await Promise.all([
      listMatchingIds(supabase, "video_casts", "video_id", field, id),
      listMatchingIds(supabase, "live_casts", "live_id", field, id),
      listMatchingIds(supabase, "radio_casts", "radio_id", field, id),
      listMatchingIds(supabase, "article_casts", "article_id", field, id),
      listMatchingIds(supabase, "tv_show_casts", "tv_show_id", field, id),
    ]);

  const [videosRes, livesRes, radiosRes, articlesRes, tvShowsRes] =
    await Promise.all([
      videoIds.length > 0
        ? supabase
            .from("videos")
            .select(`*, video_casts(${CAST_SUBSELECT})`)
            .in("id", videoIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      liveIds.length > 0
        ? supabase
            .from("lives")
            .select(`*, live_casts(${CAST_SUBSELECT})`)
            .in("id", liveIds)
            .order("event_date", { ascending: false, nullsFirst: false })
            .order("start_time", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      radioIds.length > 0
        ? supabase
            .from("radios")
            .select(`*, radio_casts(${CAST_SUBSELECT})`)
            .in("id", radioIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      articleIds.length > 0
        ? supabase
            .from("articles")
            .select(`*, article_casts(${CAST_SUBSELECT})`)
            .in("id", articleIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      tvShowIds.length > 0
        ? supabase
            .from("tv_shows")
            .select(`*, tv_show_casts(${CAST_SUBSELECT})`)
            .in("id", tvShowIds)
            .order("air_date", { ascending: false, nullsFirst: false })
            .order("air_time", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  const errors = [videosRes, livesRes, radiosRes, articlesRes, tvShowsRes]
    .map((r) => r.error)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  if (errors.length > 0) {
    throw new Error(`出演コンテンツの取得に失敗しました: ${errors[0].message}`);
  }

  const videos: VideoWithCasts[] = ((videosRes.data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    youtube_url: (r.youtube_url as string | null) ?? null,
    youtube_video_id: (r.youtube_video_id as string | null) ?? null,
    youtube_channel_id: (r.youtube_channel_id as string | null) ?? null,
    thumbnail_url: (r.thumbnail_url as string | null) ?? null,
    published_at: (r.published_at as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: castsOf(r, "video_casts"),
  }));

  const lives: LiveWithCasts[] = ((livesRes.data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    event_date: (r.event_date as string | null) ?? null,
    start_time: (r.start_time as string | null) ?? null,
    venue: (r.venue as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    is_notified: r.is_notified as boolean,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: castsOf(r, "live_casts"),
  }));

  const radios: RadioWithCasts[] = ((radiosRes.data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    platform: (r.platform as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    published_at: (r.published_at as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: castsOf(r, "radio_casts"),
  }));

  const articles: ArticleWithCasts[] = ((articlesRes.data ?? []) as Row[]).map(
    (r) => ({
      id: r.id as string,
      title: r.title as string,
      url: (r.url as string | null) ?? null,
      source: (r.source as string | null) ?? null,
      published_at: (r.published_at as string | null) ?? null,
      content: (r.content as string | null) ?? null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      casts: castsOf(r, "article_casts"),
    })
  );

  const tvShows: TvShowWithCasts[] = ((tvShowsRes.data ?? []) as Row[]).map(
    (r) => ({
      id: r.id as string,
      title: r.title as string,
      network: (r.network as string | null) ?? null,
      air_date: (r.air_date as string | null) ?? null,
      air_time: (r.air_time as string | null) ?? null,
      description: (r.description as string | null) ?? null,
      url: (r.url as string | null) ?? null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      casts: castsOf(r, "tv_show_casts"),
    })
  );

  return { videos, lives, radios, articles, tvShows };
}
