import type { createClient } from "@/lib/supabase/server";
import type { CastType } from "@/lib/types";

export type SortOrder = "newest" | "oldest";

export type PerformerFilter = {
  type: CastType;
  id: string;
};

export type ListOptions = {
  sort?: SortOrder;
  performer?: PerformerFilter | null;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CastTable =
  | "video_casts"
  | "live_casts"
  | "radio_casts"
  | "article_casts"
  | "tv_show_casts"
  | "topic_casts";

function castFieldFor(
  type: CastType
): "artist_id" | "comedy_group_id" | "unit_id" {
  if (type === "artist") return "artist_id";
  if (type === "comedy_group") return "comedy_group_id";
  return "unit_id";
}

export async function getIdsForPerformer<K extends string>(
  supabase: SupabaseClient,
  castTable: CastTable,
  parentIdField: K,
  performer: PerformerFilter
): Promise<string[]> {
  const { data, error } = await supabase
    .from(castTable)
    .select(parentIdField)
    .eq(castFieldFor(performer.type), performer.id);

  if (error) {
    throw new Error(`出演者による絞り込みに失敗しました: ${error.message}`);
  }

  const ids = ((data ?? []) as Array<Record<K, string>>).map(
    (row) => row[parentIdField]
  );
  return Array.from(new Set(ids));
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parsePerformerParam(
  raw: string | string[] | null | undefined
): PerformerFilter | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep < 0) return null;
  const type = value.slice(0, sep);
  const id = value.slice(sep + 1);
  if (!UUID_PATTERN.test(id)) return null;
  if (type !== "artist" && type !== "comedy_group" && type !== "unit") {
    return null;
  }
  return { type, id };
}

export function parseSortParam(
  raw: string | string[] | null | undefined
): SortOrder {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "oldest" ? "oldest" : "newest";
}
