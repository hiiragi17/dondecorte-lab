import { createClient } from "@/lib/supabase/server";
import type { Combo, ComboMemberWithArtist } from "@/lib/types/combo";

export type ComboSummary = Pick<Combo, "id" | "name" | "kana_name">;

export type ComboWithMembers = Combo & {
  members: ComboMemberWithArtist[];
};

export async function listCombos(): Promise<Combo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comedy_groups")
    .select("*")
    .order("kana_name", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`コンビ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Combo[];
}

export async function getCombo(id: string): Promise<ComboWithMembers | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comedy_groups")
    .select(
      `*, members:comedy_group_members(
         id,
         comedy_group_id,
         artist_id,
         role,
         created_at,
         artist:artists(id, name, kana_name)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`コンビ情報の取得に失敗しました: ${error.message}`);
  }

  return (data ?? null) as ComboWithMembers | null;
}

export async function listComboSummaries(): Promise<ComboSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comedy_groups")
    .select("id, name, kana_name")
    .order("kana_name", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`コンビ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as ComboSummary[];
}
