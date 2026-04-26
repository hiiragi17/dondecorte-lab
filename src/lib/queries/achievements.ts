import { createClient } from "@/lib/supabase/server";
import type { Achievement, AchievementWithTarget } from "@/lib/types/achievement";

export async function listAchievementsByTarget(
  field: "artist_id" | "comedy_group_id" | "unit_id",
  id: string
): Promise<Achievement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq(field, id)
    .order("year", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`受賞歴の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Achievement[];
}

export async function listAchievements(): Promise<AchievementWithTarget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select(
      `*,
       artist:artists(id, name),
       comedy_group:comedy_groups(id, name),
       unit:units(id, name)`
    )
    .order("year", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`受賞歴一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as AchievementWithTarget[];
}

export async function getAchievement(
  id: string
): Promise<AchievementWithTarget | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select(
      `*,
       artist:artists(id, name),
       comedy_group:comedy_groups(id, name),
       unit:units(id, name)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`受賞歴の取得に失敗しました: ${error.message}`);
  }

  return (data ?? null) as AchievementWithTarget | null;
}
