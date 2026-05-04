import { createClient } from "@/lib/supabase/server";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import type { CastEntry, ContentType } from "@/lib/types";
import type { ArticleWithCasts } from "@/lib/types/article";
import type { LiveWithCasts } from "@/lib/types/live";
import type { RadioWithCasts } from "@/lib/types/radio";
import type { TopicWithCasts } from "@/lib/types/topic";
import type { TvShowWithCasts } from "@/lib/types/tv-show";
import type { VideoWithCasts } from "@/lib/types/video";

export type RelatedContents = {
  videos: VideoWithCasts[];
  lives: LiveWithCasts[];
  radios: RadioWithCasts[];
  articles: ArticleWithCasts[];
  tvShows: TvShowWithCasts[];
  topics: TopicWithCasts[];
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

type CastTableName =
  | "video_casts"
  | "live_casts"
  | "radio_casts"
  | "article_casts"
  | "tv_show_casts"
  | "topic_casts";

function castsOf(record: Row, key: string): CastEntry[] {
  return mapCasts(record[key] as CastRow[] | null | undefined);
}

function partitionCasts(casts: CastEntry[]) {
  const artistIds: string[] = [];
  const comedyGroupIds: string[] = [];
  const unitIds: string[] = [];
  for (const c of casts) {
    if (c.type === "artist") artistIds.push(c.id);
    else if (c.type === "comedy_group") comedyGroupIds.push(c.id);
    else unitIds.push(c.id);
  }
  return { artistIds, comedyGroupIds, unitIds };
}

async function listMatchingParentIds<K extends string>(
  supabase: SupabaseClient,
  castTable: CastTableName,
  parentIdField: K,
  artistIds: string[],
  comedyGroupIds: string[],
  unitIds: string[]
): Promise<string[]> {
  if (
    artistIds.length === 0 &&
    comedyGroupIds.length === 0 &&
    unitIds.length === 0
  ) {
    return [];
  }

  const filters: string[] = [];
  if (artistIds.length > 0)
    filters.push(`artist_id.in.(${artistIds.join(",")})`);
  if (comedyGroupIds.length > 0)
    filters.push(`comedy_group_id.in.(${comedyGroupIds.join(",")})`);
  if (unitIds.length > 0) filters.push(`unit_id.in.(${unitIds.join(",")})`);

  const { data, error } = await supabase
    .from(castTable)
    .select(parentIdField)
    .or(filters.join(","));

  if (error) {
    throw new Error(`関連コンテンツの取得に失敗しました: ${error.message}`);
  }

  const ids = ((data ?? []) as Array<Record<K, string>>).map(
    (row) => row[parentIdField]
  );
  return Array.from(new Set(ids));
}

export async function getRelatedContents(
  contentType: ContentType,
  excludeId: string,
  casts: CastEntry[],
  limitPerType: number
): Promise<RelatedContents> {
  const { artistIds, comedyGroupIds, unitIds } = partitionCasts(casts);

  const empty: RelatedContents = {
    videos: [],
    lives: [],
    radios: [],
    articles: [],
    tvShows: [],
    topics: [],
  };

  if (
    artistIds.length === 0 &&
    comedyGroupIds.length === 0 &&
    unitIds.length === 0
  ) {
    return empty;
  }

  const supabase = await createClient();

  const [videoIds, liveIds, radioIds, articleIds, tvShowIds, topicIds] =
    await Promise.all([
      listMatchingParentIds(
        supabase,
        "video_casts",
        "video_id",
        artistIds,
        comedyGroupIds,
        unitIds
      ),
      listMatchingParentIds(
        supabase,
        "live_casts",
        "live_id",
        artistIds,
        comedyGroupIds,
        unitIds
      ),
      listMatchingParentIds(
        supabase,
        "radio_casts",
        "radio_id",
        artistIds,
        comedyGroupIds,
        unitIds
      ),
      listMatchingParentIds(
        supabase,
        "article_casts",
        "article_id",
        artistIds,
        comedyGroupIds,
        unitIds
      ),
      listMatchingParentIds(
        supabase,
        "tv_show_casts",
        "tv_show_id",
        artistIds,
        comedyGroupIds,
        unitIds
      ),
      listMatchingParentIds(
        supabase,
        "topic_casts",
        "topic_id",
        artistIds,
        comedyGroupIds,
        unitIds
      ),
    ]);

  const filterIds = (ids: string[], type: ContentType) =>
    contentType === type ? ids.filter((id) => id !== excludeId) : ids;

  const targetVideoIds = filterIds(videoIds, "video");
  const targetLiveIds = filterIds(liveIds, "live");
  const targetRadioIds = filterIds(radioIds, "radio");
  const targetArticleIds = filterIds(articleIds, "article");
  const targetTvShowIds = filterIds(tvShowIds, "tv_show");
  const targetTopicIds = filterIds(topicIds, "topic");

  const [videosRes, livesRes, radiosRes, articlesRes, tvShowsRes, topicsRes] =
    await Promise.all([
      targetVideoIds.length > 0
        ? supabase
            .from("videos")
            .select(`*, video_casts(${CAST_SUBSELECT})`)
            .in("id", targetVideoIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(limitPerType)
        : Promise.resolve({ data: [], error: null }),
      targetLiveIds.length > 0
        ? supabase
            .from("lives")
            .select(`*, live_casts(${CAST_SUBSELECT})`)
            .in("id", targetLiveIds)
            .order("event_date", { ascending: false, nullsFirst: false })
            .order("start_time", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(limitPerType)
        : Promise.resolve({ data: [], error: null }),
      targetRadioIds.length > 0
        ? supabase
            .from("radios")
            .select(`*, radio_casts(${CAST_SUBSELECT})`)
            .in("id", targetRadioIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(limitPerType)
        : Promise.resolve({ data: [], error: null }),
      targetArticleIds.length > 0
        ? supabase
            .from("articles")
            .select(`*, article_casts(${CAST_SUBSELECT})`)
            .in("id", targetArticleIds)
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(limitPerType)
        : Promise.resolve({ data: [], error: null }),
      targetTvShowIds.length > 0
        ? supabase
            .from("tv_shows")
            .select(`*, tv_show_casts(${CAST_SUBSELECT})`)
            .in("id", targetTvShowIds)
            .order("air_date", { ascending: false, nullsFirst: false })
            .order("air_time", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(limitPerType)
        : Promise.resolve({ data: [], error: null }),
      targetTopicIds.length > 0
        ? supabase
            .from("topics")
            .select(`*, topic_casts(${CAST_SUBSELECT})`)
            .in("id", targetTopicIds)
            .order("topic_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(limitPerType)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const errors = [
    videosRes,
    livesRes,
    radiosRes,
    articlesRes,
    tvShowsRes,
    topicsRes,
  ]
    .map((r) => r.error)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  if (errors.length > 0) {
    throw new Error(`関連コンテンツの取得に失敗しました: ${errors[0].message}`);
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

  const topics: TopicWithCasts[] = ((topicsRes.data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    content: (r.content as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    source: (r.source as string | null) ?? null,
    topic_date: (r.topic_date as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    casts: castsOf(r, "topic_casts"),
  }));

  return { videos, lives, radios, articles, tvShows, topics };
}
