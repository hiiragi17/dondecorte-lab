import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Magazine, MagazineWithCasts } from "@/lib/types/magazine";

function toMagazineBase(row: Record<string, unknown>): Magazine {
  return {
    id: row.id as string,
    title: row.title as string,
    magazine_name: (row.magazine_name as string | null) ?? null,
    issue: (row.issue as string | null) ?? null,
    publisher: (row.publisher as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    published_on: (row.published_on as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listMagazines(
  options: ListOptions = {}
): Promise<Magazine[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(
      supabase,
      "magazine",
      options.performer
    );
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("magazines")
    .select("*")
    .order("published_on", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`雑誌一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Magazine[];
}

export async function listMagazinesWithCasts(
  options: ListOptions = {}
): Promise<MagazineWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(
      supabase,
      "magazine",
      options.performer
    );
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("magazines")
    .select("*")
    .order("published_on", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`雑誌一覧の取得に失敗しました: ${error.message}`);
  }

  const magazines = (data ?? []).map((row) =>
    toMagazineBase(row as Record<string, unknown>)
  );
  const castsByContent = await fetchCastsByContent(
    supabase,
    "magazine",
    magazines.map((m) => m.id)
  );

  return magazines.map((magazine) => ({
    ...magazine,
    casts: castsByContent.get(magazine.id) ?? [],
  }));
}

export async function getMagazine(
  id: string
): Promise<MagazineWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("magazines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`雑誌情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "magazine", [id]);
  return {
    ...toMagazineBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
