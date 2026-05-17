import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Topic, TopicWithCasts } from "@/lib/types/topic";

function toTopicBase(row: Record<string, unknown>): Topic {
  return {
    id: row.id as string,
    title: row.title as string,
    content: (row.content as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    topic_date: (row.topic_date as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listTopics(
  options: ListOptions = {}
): Promise<Topic[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "topic", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("topics")
    .select("*")
    .order("topic_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`トピック一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Topic[];
}

export async function listTopicsWithCasts(
  options: ListOptions = {}
): Promise<TopicWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "topic", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("topics")
    .select("*")
    .order("topic_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`トピック一覧の取得に失敗しました: ${error.message}`);
  }

  const topics = (data ?? []).map((row) =>
    toTopicBase(row as Record<string, unknown>)
  );
  const castsByContent = await fetchCastsByContent(
    supabase,
    "topic",
    topics.map((t) => t.id)
  );

  return topics.map((topic) => ({
    ...topic,
    casts: castsByContent.get(topic.id) ?? [],
  }));
}

export async function getTopic(id: string): Promise<TopicWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`トピック情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "topic", [id]);
  return {
    ...toTopicBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
