import { createClient } from "@/lib/supabase/server";
import type { ContentType } from "@/lib/types";
import type { Memo } from "@/lib/types/memo";

export async function listMemos(
  targetType: ContentType,
  targetId: string
): Promise<Memo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`感想の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Memo[];
}
