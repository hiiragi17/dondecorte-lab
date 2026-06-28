import { createClient } from "@/lib/supabase/server";
import type { ContentType } from "@/lib/types";
import type { Live } from "@/lib/types/live";
import type { Video } from "@/lib/types/video";

export type RecentContentItem = {
  type: ContentType;
  id: string;
  title: string;
  createdAt: string;
  date: string | null;
};

const UPCOMING_LIVES_LIMIT = 5;
const LATEST_VIDEOS_LIMIT = 3;
const RECENT_TOTAL_LIMIT = 10;
const RECENT_PER_TYPE_LIMIT = RECENT_TOTAL_LIMIT;
const BUSINESS_TIMEZONE = "Asia/Tokyo";

function todayInBusinessTimezone(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export async function getUpcomingLives(): Promise<Live[]> {
  const supabase = await createClient();
  const today = todayInBusinessTimezone();

  const { data, error } = await supabase
    .from("lives")
    .select("*")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false })
    .limit(UPCOMING_LIVES_LIMIT);

  if (error) {
    throw new Error(`直近のライブ予定の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Live[];
}

export async function getLatestVideos(): Promise<Video[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(LATEST_VIDEOS_LIMIT);

  if (error) {
    throw new Error(`最新動画の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Video[];
}

type RecentRow = {
  id: string;
  title: string;
  created_at: string;
};

export async function getRecentContent(): Promise<RecentContentItem[]> {
  const supabase = await createClient();

  const [videos, lives, radios, articles, tvShows, topics, cms, magazines] =
    await Promise.all([
    supabase
      .from("videos")
      .select("id, title, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("lives")
      .select("id, title, created_at, event_date")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("radios")
      .select("id, title, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("articles")
      .select("id, title, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("tv_shows")
      .select("id, title, created_at, air_date")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("topics")
      .select("id, title, created_at, topic_date")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("cms")
      .select("id, title, created_at, aired_on")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
    supabase
      .from("magazines")
      .select("id, title, created_at, published_on")
      .order("created_at", { ascending: false })
      .limit(RECENT_PER_TYPE_LIMIT),
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
    throw new Error(
      `最近追加されたコンテンツの取得に失敗しました: ${errors[0].message}`
    );
  }

  const items: RecentContentItem[] = [
    ...((videos.data ?? []) as (RecentRow & { published_at: string | null })[]).map(
      (v) => ({
        type: "video" as const,
        id: v.id,
        title: v.title,
        createdAt: v.created_at,
        date: v.published_at,
      })
    ),
    ...((lives.data ?? []) as (RecentRow & { event_date: string | null })[]).map(
      (l) => ({
        type: "live" as const,
        id: l.id,
        title: l.title,
        createdAt: l.created_at,
        date: l.event_date,
      })
    ),
    ...((radios.data ?? []) as (RecentRow & { published_at: string | null })[]).map(
      (r) => ({
        type: "radio" as const,
        id: r.id,
        title: r.title,
        createdAt: r.created_at,
        date: r.published_at,
      })
    ),
    ...((articles.data ?? []) as (RecentRow & { published_at: string | null })[]).map(
      (a) => ({
        type: "article" as const,
        id: a.id,
        title: a.title,
        createdAt: a.created_at,
        date: a.published_at,
      })
    ),
    ...((tvShows.data ?? []) as (RecentRow & { air_date: string | null })[]).map(
      (t) => ({
        type: "tv_show" as const,
        id: t.id,
        title: t.title,
        createdAt: t.created_at,
        date: t.air_date,
      })
    ),
    ...((topics.data ?? []) as (RecentRow & { topic_date: string | null })[]).map(
      (t) => ({
        type: "topic" as const,
        id: t.id,
        title: t.title,
        createdAt: t.created_at,
        date: t.topic_date,
      })
    ),
    ...((cms.data ?? []) as (RecentRow & { aired_on: string | null })[]).map(
      (c) => ({
        type: "cm" as const,
        id: c.id,
        title: c.title,
        createdAt: c.created_at,
        date: c.aired_on,
      })
    ),
    ...((magazines.data ?? []) as (RecentRow & {
      published_on: string | null;
    })[]).map((m) => ({
      type: "magazine" as const,
      id: m.id,
      title: m.title,
      createdAt: m.created_at,
      date: m.published_on,
    })),
  ];

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items.slice(0, RECENT_TOTAL_LIMIT);
}
