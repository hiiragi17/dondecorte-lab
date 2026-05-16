import type { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

export const DONDECORTE_COMBO_NAME = "ドンデコルテ";

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ContentRef = {
  contentType: ContentType;
  contentId: string;
};

export type CoCastRow = {
  content_type: ContentType;
  content_id: string;
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};

const CO_CAST_SELECT = `
  content_type,
  content_id,
  artist_id,
  comedy_group_id,
  unit_id,
  artist:artists(id, name),
  comedy_group:comedy_groups(id, name),
  unit:units(id, name)
`;

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

/**
 * ドンデコルテが出演しているコンテンツの一覧（重複排除済み）。
 * 旧実装では 6 つの cast テーブルを個別に走査していたが、
 * casts 統合テーブルにより 1 クエリで取得できる。
 */
export async function listDondecorteContents(
  supabase: SupabaseClient,
  dondecorteId: string
): Promise<ContentRef[]> {
  const { data, error } = await supabase
    .from("casts")
    .select("content_type, content_id")
    .eq("comedy_group_id", dondecorteId);

  if (error) {
    throw new Error(`共演者情報の取得に失敗しました: ${error.message}`);
  }

  const seen = new Set<string>();
  const refs: ContentRef[] = [];
  for (const row of (data ?? []) as Array<{
    content_type: ContentType;
    content_id: string;
  }>) {
    const key = `${row.content_type}:${row.content_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ contentType: row.content_type, contentId: row.content_id });
  }
  return refs;
}

/**
 * 指定したコンテンツ群に出演する全 casts 行を取得する。
 *
 * PostgREST では複合キー (content_type, content_id) の IN 条件を直接
 * 表現できないため content_id で取得し、ポリモーフィックモデルの論理キー
 * (content_type, content_id) で JS 側で絞り込む（content_id が
 * コンテンツ種別をまたいで衝突しても誤った行を拾わないようにするため）。
 */
export async function listCastsForContents(
  supabase: SupabaseClient,
  refs: ContentRef[]
): Promise<CoCastRow[]> {
  if (refs.length === 0) return [];

  const contentIds = Array.from(new Set(refs.map((r) => r.contentId)));
  const allowed = new Set(
    refs.map((r) => `${r.contentType}:${r.contentId}`)
  );

  const { data, error } = await supabase
    .from("casts")
    .select(CO_CAST_SELECT)
    .in("content_id", contentIds);

  if (error) {
    throw new Error(`共演者情報の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as unknown as CoCastRow[]).filter((row) =>
    allowed.has(`${row.content_type}:${row.content_id}`)
  );
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
