import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// PostgREST は 1 リクエストあたりの返却行数に上限があるため分割取得する
const PAGE_SIZE = 1000;

/**
 * 承認済み動画の ID 集合を取得する。
 *
 * casts はポリモーフィック設計で videos へ FK を張れず、PostgREST の埋め込みで
 * review_status を JOIN できない。そのため casts を直接読む集計系クエリ
 * （ランキング・共演者）は、この集合で video の casts 行を絞り込み、
 * 承認前・却下済み動画が公開側の集計に混入しないようにする。
 */
export async function fetchApprovedVideoIds(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const ids = new Set<string>();

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("videos")
      .select("id")
      .eq("review_status", "approved")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`承認済み動画の取得に失敗しました: ${error.message}`);
    }

    const page = (data ?? []) as Array<{ id: string }>;
    for (const row of page) ids.add(row.id);
    if (page.length < PAGE_SIZE) break;
  }

  return ids;
}

/** video 以外は常に可視。video は承認済みのみ可視 */
export function isVisibleContent(
  contentType: string,
  contentId: string,
  approvedVideoIds: Set<string>
): boolean {
  return contentType !== "video" || approvedVideoIds.has(contentId);
}
