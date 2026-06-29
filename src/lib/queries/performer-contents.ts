import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import type { ContentType } from "@/lib/types";
import type { ArticleWithCasts } from "@/lib/types/article";
import type { CmWithCasts } from "@/lib/types/cm";
import type { LiveWithCasts } from "@/lib/types/live";
import type { MagazineWithCasts } from "@/lib/types/magazine";
import type { RadioWithCasts } from "@/lib/types/radio";
import type { TopicWithCasts } from "@/lib/types/topic";
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
  topics: TopicWithCasts[];
  cms: CmWithCasts[];
  magazines: MagazineWithCasts[];
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

  const [videoIds, liveIds, radioIds, articleIds, tvShowIds, topicIds, cmIds, magazineIds] =
    await Promise.all([
      listMatchingContentIds(supabase, "video", field, id),
      listMatchingContentIds(supabase, "live", field, id),
      listMatchingContentIds(supabase, "radio", field, id),
      listMatchingContentIds(supabase, "article", field, id),
      listMatchingContentIds(supabase, "tv_show", field, id),
      listMatchingContentIds(supabase, "topic", field, id),
      listMatchingContentIds(supabase, "cm", field, id),
      listMatchingContentIds(supabase, "magazine", field, id),
    ]);

  const [
    videosRes,
    livesRes,
    radiosRes,
    articlesRes,
    tvShowsRes,
    topicsRes,
    cmsRes,
    magazinesRes,
  ] = await Promise.all([
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
      topicIds.length > 0
        ? supabase
            .from("topics")
            .select("*")
            .in("id", topicIds)
            .order("topic_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      cmIds.length > 0
        ? supabase
            .from("cms")
            .select("*")
            .in("id", cmIds)
            .order("aired_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      magazineIds.length > 0
        ? supabase
            .from("magazines")
            .select("*")
            .in("id", magazineIds)
            .order("published_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  const errors = [
    videosRes,
    livesRes,
    radiosRes,
    articlesRes,
    tvShowsRes,
    topicsRes,
    cmsRes,
    magazinesRes,
  ]
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
  const topicRows = (topicsRes.data ?? []) as Row[];
  const cmRows = (cmsRes.data ?? []) as Row[];
  const magazineRows = (magazinesRes.data ?? []) as Row[];

  const idsOf = (rows: Row[]) => rows.map((r) => r.id as string);

  const [
    videoCasts,
    liveCasts,
    radioCasts,
    articleCasts,
    tvShowCasts,
    topicCasts,
    cmCasts,
    magazineCasts,
  ] = await Promise.all([
      fetchCastsByContent(supabase, "video", idsOf(videoRows)),
      fetchCastsByContent(supabase, "live", idsOf(liveRows)),
      fetchCastsByContent(supabase, "radio", idsOf(radioRows)),
      fetchCastsByContent(supabase, "article", idsOf(articleRows)),
      fetchCastsByContent(supabase, "tv_show", idsOf(tvShowRows)),
      fetchCastsByContent(supabase, "topic", idsOf(topicRows)),
      fetchCastsByContent(supabase, "cm", idsOf(cmRows)),
      fetchCastsByContent(supabase, "magazine", idsOf(magazineRows)),
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

  const topics: TopicWithCasts[] = topicRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    content: (r.content as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    source: (r.source as string | null) ?? null,
    topic_date: (r.topic_date as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: topicCasts.get(r.id as string) ?? [],
  }));

  const cms: CmWithCasts[] = cmRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    advertiser: (r.advertiser as string | null) ?? null,
    product: (r.product as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    aired_on: (r.aired_on as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: cmCasts.get(r.id as string) ?? [],
  }));

  const magazines: MagazineWithCasts[] = magazineRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    magazine_name: (r.magazine_name as string | null) ?? null,
    issue: (r.issue as string | null) ?? null,
    publisher: (r.publisher as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    published_on: (r.published_on as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: magazineCasts.get(r.id as string) ?? [],
  }));

  return { videos, lives, radios, articles, tvShows, topics, cms, magazines };
}
