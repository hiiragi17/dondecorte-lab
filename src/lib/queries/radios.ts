import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Radio, RadioWithCasts } from "@/lib/types/radio";

function toRadioBase(row: Record<string, unknown>): Radio {
  return {
    id: row.id as string,
    title: row.title as string,
    platform: (row.platform as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listRadios(options: ListOptions = {}): Promise<Radio[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "radio", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("radios")
    .select("*")
    .order("published_at", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`ラジオ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Radio[];
}

export async function listRadiosWithCasts(
  options: ListOptions = {}
): Promise<RadioWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "radio", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("radios")
    .select("*")
    .order("published_at", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`ラジオ一覧の取得に失敗しました: ${error.message}`);
  }

  const radios = (data ?? []).map((row) =>
    toRadioBase(row as Record<string, unknown>)
  );
  const castsByContent = await fetchCastsByContent(
    supabase,
    "radio",
    radios.map((r) => r.id)
  );

  return radios.map((radio) => ({
    ...radio,
    casts: castsByContent.get(radio.id) ?? [],
  }));
}

export async function getRadio(id: string): Promise<RadioWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("radios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`ラジオ情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "radio", [id]);
  return {
    ...toRadioBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
