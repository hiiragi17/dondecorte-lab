import type { createClient } from "@/lib/supabase/server";
import type { CastEntry, CastType, ContentType } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const CAST_TYPES: readonly CastType[] = ["artist", "comedy_group", "unit"];

function isCastType(value: string): value is CastType {
  return (CAST_TYPES as readonly string[]).includes(value);
}

/**
 * cast-selector が送出する cast_type / cast_id / cast_name の並列フィールドを
 * CastEntry[] に変換する。種別不正・重複は呼び出し側に伝えるエラーとして返す。
 */
export function parseCasts(formData: FormData): {
  casts: CastEntry[];
  error?: string;
} {
  const types = formData.getAll("cast_type").map((v) => String(v));
  const ids = formData.getAll("cast_id").map((v) => String(v));
  const names = formData.getAll("cast_name").map((v) => String(v));

  const casts: CastEntry[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < types.length; i += 1) {
    const type = types[i]?.trim();
    const id = ids[i]?.trim();
    const name = names[i]?.trim() ?? "";

    if (!type || !id) continue;
    if (!isCastType(type)) {
      return { casts: [], error: "出演者の種別が不正です" };
    }

    const key = `${type}:${id}`;
    if (seen.has(key)) {
      return { casts: [], error: "同じ出演者を複数回追加できません" };
    }
    seen.add(key);

    casts.push({ type, id, name });
  }

  return { casts };
}

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
): Promise<{ id?: string; error?: string; notFound?: boolean }> {
  // RPC は upsert したコンテンツの id を返す。
  const { data, error } = await supabase.rpc("upsert_content_with_casts", {
    p_content_type: params.contentType,
    p_content_id: params.contentId,
    p_content: params.content,
    p_casts: params.casts.map((c) => ({ type: c.type, id: c.id })),
  });

  if (error) {
    // PL/pgSQL の no_data_found(SQLSTATE P0002)= 更新対象が見つからない
    return { error: error.message, notFound: error.code === "P0002" };
  }

  return { id: (data as string | null) ?? undefined };
}
