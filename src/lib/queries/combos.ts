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

export type ComboMembershipEntry = {
  combo: Pick<Combo, "id" | "name" | "kana_name" | "image_url" | "theme_color">;
  role: string | null;
};

export async function listCombosForArtist(
  artistId: string
): Promise<ComboMembershipEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comedy_group_members")
    .select(
      `role,
       comedy_group:comedy_groups(id, name, kana_name, image_url, theme_color)`
    )
    .eq("artist_id", artistId);

  if (error) {
    throw new Error(`所属コンビの取得に失敗しました: ${error.message}`);
  }

  type Row = {
    role: string | null;
    comedy_group: {
      id: string;
      name: string;
      kana_name: string | null;
      image_url: string | null;
      theme_color: string | null;
    } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows
    .flatMap<ComboMembershipEntry>((row) =>
      row.comedy_group
        ? [{ combo: row.comedy_group, role: row.role }]
        : []
    )
    .sort((a, b) => {
      const ka = a.combo.kana_name ?? "";
      const kb = b.combo.kana_name ?? "";
      const cmp = ka.localeCompare(kb);
      return cmp !== 0 ? cmp : a.combo.name.localeCompare(b.combo.name);
    });
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
