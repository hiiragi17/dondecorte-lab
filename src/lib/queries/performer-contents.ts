import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import type { ContentType } from "@/lib/types";
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

type Row = Record<string, unknown>;
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function listMatchingContentIds(
  supabase: SupabaseClient,
  contentType: ContentType,
  field: PerformerField,
  id: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("casts")
    .select("content_id")
    .eq("content_type", contentType)
    .eq(field, id);

  if (error) {
    throw new Error(`出演コンテンツの取得に失敗しました: ${error.message}`);
  }

  const ids = ((data ?? []) as Array<{ content_id: string }>).map(
    (row) => row.content_id
  );
  return Array.from(new Set(ids));
}

export async function getPerformerContents(
  field: PerformerField,
  id: string
): Promise<PerformerContents> {
  const supabase = await createClient();

  const [videoIds, liveIds, radioIds, articleIds, tvShowIds] =
    await Promise.all([
      listMatchingContentIds(supabase, "video", field, id),
      listMatchingContentIds(supabase, "live", field, id),
      listMatchingContentIds(supabase, "radio", field, id),
      listMatchingContentIds(supabase, "article", field, id),
      listMatchingContentIds(supabase, "tv_show", field, id),
    ]);

  const [videosRes, livesRes, radiosRes, articlesRes, tvShowsRes] =
    await Promise.all([
      videoIds.length > 0
        ? supabase
            .from("videos")
            .select("*")
            .in("id", videoIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      liveIds.length > 0
        ? supabase
            .from("lives")
            .select("*")
            .in("id", liveIds)
            .order("event_date", { ascending: false, nullsFirst: false })
            .order("start_time", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      radioIds.length > 0
        ? supabase
            .from("radios")
            .select("*")
            .in("id", radioIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      articleIds.length > 0
        ? supabase
            .from("articles")
            .select("*")
            .in("id", articleIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      tvShowIds.length > 0
        ? supabase
            .from("tv_shows")
            .select("*")
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

  const videoRows = (videosRes.data ?? []) as Row[];
  const liveRows = (livesRes.data ?? []) as Row[];
  const radioRows = (radiosRes.data ?? []) as Row[];
  const articleRows = (articlesRes.data ?? []) as Row[];
  const tvShowRows = (tvShowsRes.data ?? []) as Row[];

  const idsOf = (rows: Row[]) => rows.map((r) => r.id as string);

  const [videoCasts, liveCasts, radioCasts, articleCasts, tvShowCasts] =
    await Promise.all([
      fetchCastsByContent(supabase, "video", idsOf(videoRows)),
      fetchCastsByContent(supabase, "live", idsOf(liveRows)),
      fetchCastsByContent(supabase, "radio", idsOf(radioRows)),
      fetchCastsByContent(supabase, "article", idsOf(articleRows)),
      fetchCastsByContent(supabase, "tv_show", idsOf(tvShowRows)),
    ]);

  const videos: VideoWithCasts[] = videoRows.map((r) => ({
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
    casts: videoCasts.get(r.id as string) ?? [],
  }));

  const lives: LiveWithCasts[] = liveRows.map((r) => ({
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
    casts: liveCasts.get(r.id as string) ?? [],
  }));

  const radios: RadioWithCasts[] = radioRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    platform: (r.platform as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    published_at: (r.published_at as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: radioCasts.get(r.id as string) ?? [],
  }));

  const articles: ArticleWithCasts[] = articleRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    url: (r.url as string | null) ?? null,
    source: (r.source as string | null) ?? null,
    published_at: (r.published_at as string | null) ?? null,
    content: (r.content as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: articleCasts.get(r.id as string) ?? [],
  }));

  const tvShows: TvShowWithCasts[] = tvShowRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    network: (r.network as string | null) ?? null,
    air_date: (r.air_date as string | null) ?? null,
    air_time: (r.air_time as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: tvShowCasts.get(r.id as string) ?? [],
  }));

  return { videos, lives, radios, articles, tvShows };
}
