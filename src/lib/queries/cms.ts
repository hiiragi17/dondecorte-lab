import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Cm, CmWithCasts } from "@/lib/types/cm";

function toCmBase(row: Record<string, unknown>): Cm {
  return {
    id: row.id as string,
    title: row.title as string,
    advertiser: (row.advertiser as string | null) ?? null,
    product: (row.product as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    aired_on: (row.aired_on as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listCms(options: ListOptions = {}): Promise<Cm[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "cm", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("cms")
    .select("*")
    .order("aired_on", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`CM一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Cm[];
}

export async function listCmsWithCasts(
  options: ListOptions = {}
): Promise<CmWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "cm", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("cms")
    .select("*")
    .order("aired_on", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`CM一覧の取得に失敗しました: ${error.message}`);
  }

  const cms = (data ?? []).map((row) =>
    toCmBase(row as Record<string, unknown>)
  );
  const castsByContent = await fetchCastsByContent(
    supabase,
    "cm",
    cms.map((c) => c.id)
  );

  return cms.map((cm) => ({
    ...cm,
    casts: castsByContent.get(cm.id) ?? [],
  }));
}

export async function getCm(id: string): Promise<CmWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`CM情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "cm", [id]);
  return {
    ...toCmBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
