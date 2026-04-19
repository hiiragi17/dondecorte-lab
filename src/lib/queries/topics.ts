import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { Topic, TopicWithCasts } from "@/lib/types/topic";

export async function listTopics(): Promise<Topic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("topic_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`トピック一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Topic[];
}

export async function getTopic(id: string): Promise<TopicWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select(
      `*,
       topic_casts(
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
    throw new Error(`トピック情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  type CastRow = {
    artist_id: string | null;
    comedy_group_id: string | null;
    unit_id: string | null;
    artist: { id: string; name: string } | null;
    comedy_group: { id: string; name: string } | null;
    unit: { id: string; name: string } | null;
  };

  const rawCasts = (data as Record<string, unknown>).topic_casts as CastRow[];

  const casts: CastEntry[] = (rawCasts ?? []).flatMap((c) => {
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

  const topicBase: Topic = {
    id: (data as { id: string }).id,
    title: (data as { title: string }).title,
    content: (data as { content: string | null }).content,
    url: (data as { url: string | null }).url,
    source: (data as { source: string | null }).source,
    topic_date: (data as { topic_date: string | null }).topic_date,
    created_at: (data as { created_at: string }).created_at,
    updated_at: (data as { updated_at: string }).updated_at,
  };

  return { ...topicBase, casts };
}
