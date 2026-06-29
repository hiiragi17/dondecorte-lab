import { fetchCastsByContent } from "@/lib/queries/_casts";
import { createClient } from "@/lib/supabase/server";
import { type CastEntry, type ContentType } from "@/lib/types";

export type TimelineItem = {
  type: ContentType;
  id: string;
  title: string;
  /** ソート・表示用の日付。各コンテンツの主たる日付（publish/event/air/topic_date）。null の場合は created_at を使用。 */
  date: string | null;
  createdAt: string;
  casts: CastEntry[];
};

type Row = Record<string, unknown>;

function sortKey(item: TimelineItem): string {
  return item.date ?? item.createdAt;
}

export async function listTimeline(limit?: number): Promise<TimelineItem[]> {
  const supabase = await createClient();

  const [videos, lives, radios, articles, tvShows, topics, cms, magazines] =
    await Promise.all([
    supabase
      .from("videos")
      .select("id, title, published_at, created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("lives")
      .select("id, title, event_date, created_at")
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("radios")
      .select("id, title, published_at, created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("articles")
      .select("id, title, published_at, created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("tv_shows")
      .select("id, title, air_date, created_at")
      .order("air_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("topics")
      .select("id, title, topic_date, created_at")
      .order("topic_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("cms")
      .select("id, title, aired_on, created_at")
      .order("aired_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("magazines")
      .select("id, title, published_on, created_at")
      .order("published_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const errors = [
    videos,
    lives,
    radios,
    articles,
    tvShows,
    topics,
    cms,
    magazines,
  ]
    .map((r) => r.error)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  if (errors.length > 0) {
    throw new Error(`タイムラインの取得に失敗しました: ${errors[0].message}`);
  }

  const videoRows = (videos.data ?? []) as Row[];
  const liveRows = (lives.data ?? []) as Row[];
  const radioRows = (radios.data ?? []) as Row[];
  const articleRows = (articles.data ?? []) as Row[];
  const tvShowRows = (tvShows.data ?? []) as Row[];
  const topicRows = (topics.data ?? []) as Row[];
  const cmRows = (cms.data ?? []) as Row[];
  const magazineRows = (magazines.data ?? []) as Row[];

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

  const items: TimelineItem[] = [
    ...videoRows.map((r) => ({
      type: "video" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_at as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: videoCasts.get(r.id as string) ?? [],
    })),
    ...liveRows.map((r) => ({
      type: "live" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.event_date as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: liveCasts.get(r.id as string) ?? [],
    })),
    ...radioRows.map((r) => ({
      type: "radio" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_at as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: radioCasts.get(r.id as string) ?? [],
    })),
    ...articleRows.map((r) => ({
      type: "article" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_at as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: articleCasts.get(r.id as string) ?? [],
    })),
    ...tvShowRows.map((r) => ({
      type: "tv_show" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.air_date as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: tvShowCasts.get(r.id as string) ?? [],
    })),
    ...topicRows.map((r) => ({
      type: "topic" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.topic_date as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: topicCasts.get(r.id as string) ?? [],
    })),
    ...cmRows.map((r) => ({
      type: "cm" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.aired_on as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: cmCasts.get(r.id as string) ?? [],
    })),
    ...magazineRows.map((r) => ({
      type: "magazine" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_on as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: magazineCasts.get(r.id as string) ?? [],
    })),
  ];

  items.sort((a, b) => {
    const aKey = sortKey(a);
    const bKey = sortKey(b);
    return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
  });
  return typeof limit === "number" ? items.slice(0, limit) : items;
}
