import { createClient } from "@/lib/supabase/server";
import type { Unit, UnitMemberEntry } from "@/lib/types/unit";

export type UnitSummary = Pick<Unit, "id" | "name">;

export type UnitWithMembers = Unit & {
  members: UnitMemberEntry[];
};

export async function listUnits(): Promise<Unit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`ユニット一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Unit[];
}

export async function getUnit(id: string): Promise<UnitWithMembers | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select(
      `*,
       unit_members(
         id,
         unit_id,
         comedy_group_id,
         artist_id,
         created_at,
         comedy_group:comedy_groups(id, name, kana_name),
         artist:artists(id, name, kana_name)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`ユニット情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const rawMembers = (data as Record<string, unknown>)
    .unit_members as Array<{
    comedy_group_id: string | null;
    artist_id: string | null;
    comedy_group: { id: string; name: string; kana_name: string | null } | null;
    artist: { id: string; name: string; kana_name: string | null } | null;
  }>;

  const members: UnitMemberEntry[] = (rawMembers ?? []).flatMap((m) => {
    if (m.comedy_group_id && m.comedy_group) {
      return [
        {
          type: "comedy_group" as const,
          id: m.comedy_group.id,
          name: m.comedy_group.name,
          kana_name: m.comedy_group.kana_name,
        },
      ];
    }
    if (m.artist_id && m.artist) {
      return [
        {
          type: "artist" as const,
          id: m.artist.id,
          name: m.artist.name,
          kana_name: m.artist.kana_name,
        },
      ];
    }
    return [];
  });

  const unitBase: Unit = {
    id: (data as { id: string }).id,
    name: (data as { name: string }).name,
    description: (data as { description: string | null }).description,
    created_at: (data as { created_at: string }).created_at,
    updated_at: (data as { updated_at: string }).updated_at,
  };

  return { ...unitBase, members };
}

export async function listUnitSummaries(): Promise<UnitSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`ユニット一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as UnitSummary[];
}
