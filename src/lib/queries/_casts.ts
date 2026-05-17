import type { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

export type CastRow = {
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// casts はポリモーフィック設計（content_type + content_id）で content 側へ
// FK を張れないため、PostgREST の自動埋め込み（videos.select("*, casts(...)")）が
// 使えない。出演者の埋め込みは artist/comedy_group/unit への FK 経由で行う。
const CAST_EMBED_SELECT = `
  content_id,
  artist_id,
  comedy_group_id,
  unit_id,
  artist:artists(id, name),
  comedy_group:comedy_groups(id, name),
  unit:units(id, name)
`;

export function mapCasts(rows: CastRow[] | null | undefined): CastEntry[] {
  return (rows ?? []).flatMap((c) => {
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
}

/**
 * 指定コンテンツ群の出演者を casts テーブルからまとめて取得し、
 * content_id ごとの CastEntry[] にマップする。
 */
export async function fetchCastsByContent(
  supabase: SupabaseClient,
  contentType: ContentType,
  contentIds: string[]
): Promise<Map<string, CastEntry[]>> {
  const result = new Map<string, CastEntry[]>();
  if (contentIds.length === 0) return result;

  const { data, error } = await supabase
    .from("casts")
    .select(CAST_EMBED_SELECT)
    .eq("content_type", contentType)
    .in("content_id", contentIds);

  if (error) {
    throw new Error(`出演者情報の取得に失敗しました: ${error.message}`);
  }

  const rowsByContent = new Map<string, CastRow[]>();
  for (const row of (data ?? []) as unknown as Array<
    CastRow & { content_id: string }
  >) {
    const list = rowsByContent.get(row.content_id);
    if (list) list.push(row);
    else rowsByContent.set(row.content_id, [row]);
  }

  for (const [contentId, rows] of rowsByContent) {
    result.set(contentId, mapCasts(rows));
  }
  return result;
}
