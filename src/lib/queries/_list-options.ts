import type { createClient } from "@/lib/supabase/server";
import type { CastType, ContentType } from "@/lib/types";

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

function castFieldFor(
  type: CastType
): "artist_id" | "comedy_group_id" | "unit_id" {
  if (type === "artist") return "artist_id";
  if (type === "comedy_group") return "comedy_group_id";
  return "unit_id";
}

export async function getIdsForPerformer(
  supabase: SupabaseClient,
  contentType: ContentType,
  performer: PerformerFilter
): Promise<string[]> {
  const { data, error } = await supabase
    .from("casts")
    .select("content_id")
    .eq("content_type", contentType)
    .eq(castFieldFor(performer.type), performer.id);

  if (error) {
    throw new Error(`出演者による絞り込みに失敗しました: ${error.message}`);
  }

  const ids = ((data ?? []) as Array<{ content_id: string }>).map(
    (row) => row.content_id
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
