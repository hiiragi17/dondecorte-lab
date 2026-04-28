import { createClient } from "@/lib/supabase/server";
import type { Tag, TagSummary, TagWithCount } from "@/lib/types/tag";

export async function listTags(): Promise<TagWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*, taggings(count)")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`タグ一覧の取得に失敗しました: ${error.message}`);
  }

  type Row = Tag & { taggings: { count: number }[] };

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at,
    taggings_count: row.taggings[0]?.count ?? 0,
  }));
}

export async function listTagSummaries(): Promise<TagSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, color")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`タグ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as TagSummary[];
}

export async function getTag(id: string): Promise<Tag | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`タグの取得に失敗しました: ${error.message}`);
  }

  return (data ?? null) as Tag | null;
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`タグの取得に失敗しました: ${error.message}`);
  }

  return (data ?? null) as Tag | null;
}
