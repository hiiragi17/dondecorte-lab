import type { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * メインレコードの upsert と casts の置き換えを RPC 経由で
 * 1 トランザクション(アトミック)で実行する。
 */
export async function upsertContentWithCasts(
  supabase: SupabaseServerClient,
  params: {
    contentType: ContentType;
    contentId: string | null;
    content: Record<string, unknown>;
    casts: CastEntry[];
  }
): Promise<{ error?: string; notFound?: boolean }> {
  const { error } = await supabase.rpc("upsert_content_with_casts", {
    p_content_type: params.contentType,
    p_content_id: params.contentId,
    p_content: params.content,
    p_casts: params.casts.map((c) => ({ type: c.type, id: c.id })),
  });

  if (error) {
    // PL/pgSQL の no_data_found(SQLSTATE P0002)= 更新対象が見つからない
    return { error: error.message, notFound: error.code === "P0002" };
  }

  return {};
}
