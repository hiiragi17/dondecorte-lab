import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

export type TimelineItem = {
  type: ContentType;
  id: string;
  title: string;
  /** ソート・表示用の日付。各コンテンツの主たる日付（publish/event/air/topic_date）。null の場合は created_at を使用。 */
  date: string | null;
  createdAt: string;
  casts: CastEntry[];
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

function sortKey(item: TimelineItem): string {
  return item.date ?? item.createdAt;
}

export async function listTimeline(limit = 200): Promise<TimelineItem[]> {
  const supabase = await createClient();

  const [videos, lives, radios, articles, tvShows, topics] = await Promise.all([
    supabase
      .from("videos")
      .select(`id, title, published_at, created_at, video_casts(${CAST_SUBSELECT})`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("lives")
      .select(`id, title, event_date, created_at, live_casts(${CAST_SUBSELECT})`)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("radios")
      .select(`id, title, published_at, created_at, radio_casts(${CAST_SUBSELECT})`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("articles")
      .select(`id, title, published_at, created_at, article_casts(${CAST_SUBSELECT})`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("tv_shows")
      .select(`id, title, air_date, created_at, tv_show_casts(${CAST_SUBSELECT})`)
      .order("air_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("topics")
      .select(`id, title, topic_date, created_at, topic_casts(${CAST_SUBSELECT})`)
      .order("topic_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const errors = [videos, lives, radios, articles, tvShows, topics]
    .map((r) => r.error)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  if (errors.length > 0) {
    throw new Error(`タイムラインの取得に失敗しました: ${errors[0].message}`);
  }

  const items: TimelineItem[] = [
    ...((videos.data ?? []) as Row[]).map((r) => ({
      type: "video" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_at as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: mapCasts(r.video_casts as CastRow[] | null | undefined),
    })),
    ...((lives.data ?? []) as Row[]).map((r) => ({
      type: "live" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.event_date as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: mapCasts(r.live_casts as CastRow[] | null | undefined),
    })),
    ...((radios.data ?? []) as Row[]).map((r) => ({
      type: "radio" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_at as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: mapCasts(r.radio_casts as CastRow[] | null | undefined),
    })),
    ...((articles.data ?? []) as Row[]).map((r) => ({
      type: "article" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.published_at as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: mapCasts(r.article_casts as CastRow[] | null | undefined),
    })),
    ...((tvShows.data ?? []) as Row[]).map((r) => ({
      type: "tv_show" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.air_date as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: mapCasts(r.tv_show_casts as CastRow[] | null | undefined),
    })),
    ...((topics.data ?? []) as Row[]).map((r) => ({
      type: "topic" as const,
      id: r.id as string,
      title: r.title as string,
      date: (r.topic_date as string | null) ?? null,
      createdAt: r.created_at as string,
      casts: mapCasts(r.topic_casts as CastRow[] | null | undefined),
    })),
  ];

  items.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return items.slice(0, limit);
}
