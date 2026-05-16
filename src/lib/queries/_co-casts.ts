import type { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

export const DONDECORTE_COMBO_NAME = "ドンデコルテ";

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CastTable =
  | "video_casts"
  | "live_casts"
  | "radio_casts"
  | "article_casts"
  | "tv_show_casts"
  | "topic_casts";

export type ParentIdField =
  | "video_id"
  | "live_id"
  | "radio_id"
  | "article_id"
  | "tv_show_id"
  | "topic_id";

export type CastTableSpec = {
  table: CastTable;
  parentIdField: ParentIdField;
  contentType: ContentType;
};

export const CAST_TABLES: CastTableSpec[] = [
  { table: "video_casts", parentIdField: "video_id", contentType: "video" },
  { table: "live_casts", parentIdField: "live_id", contentType: "live" },
  { table: "radio_casts", parentIdField: "radio_id", contentType: "radio" },
  {
    table: "article_casts",
    parentIdField: "article_id",
    contentType: "article",
  },
  {
    table: "tv_show_casts",
    parentIdField: "tv_show_id",
    contentType: "tv_show",
  },
  { table: "topic_casts", parentIdField: "topic_id", contentType: "topic" },
];

export type CoCastRow = {
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};

export type RawCoCastRow = CoCastRow & Record<ParentIdField, string>;

export async function getDondecorteComedyGroupId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("comedy_groups")
    .select("id")
    .eq("name", DONDECORTE_COMBO_NAME)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`コンビ情報の取得に失敗しました: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

export async function listOwnParentIds(
  supabase: SupabaseClient,
  spec: CastTableSpec,
  dondecorteId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from(spec.table)
    .select(spec.parentIdField)
    .eq("comedy_group_id", dondecorteId);

  if (error) {
    throw new Error(
      `共演者情報の取得に失敗しました(${spec.table}): ${error.message}`
    );
  }

  const ids = ((data ?? []) as Array<Record<ParentIdField, string>>).map(
    (row) => row[spec.parentIdField]
  );
  return Array.from(new Set(ids));
}

export async function listCoCastRows(
  supabase: SupabaseClient,
  spec: CastTableSpec,
  parentIds: string[]
): Promise<RawCoCastRow[]> {
  if (parentIds.length === 0) return [];

  const { data, error } = await supabase
    .from(spec.table)
    .select(
      `${spec.parentIdField},
       artist_id,
       comedy_group_id,
       unit_id,
       artist:artists(id, name),
       comedy_group:comedy_groups(id, name),
       unit:units(id, name)`
    )
    .in(spec.parentIdField, parentIds);

  if (error) {
    throw new Error(
      `共演者情報の取得に失敗しました(${spec.table}): ${error.message}`
    );
  }

  return (data ?? []) as unknown as RawCoCastRow[];
}

export function entryFromRow(row: CoCastRow): CastEntry | null {
  if (row.artist_id && row.artist) {
    return { type: "artist", id: row.artist.id, name: row.artist.name };
  }
  if (row.comedy_group_id && row.comedy_group) {
    return {
      type: "comedy_group",
      id: row.comedy_group.id,
      name: row.comedy_group.name,
    };
  }
  if (row.unit_id && row.unit) {
    return { type: "unit", id: row.unit.id, name: row.unit.name };
  }
  return null;
}
