import { createClient } from "@/lib/supabase/server";
import type { Artist } from "@/lib/types/artist";

export async function listArtists(): Promise<Artist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .order("kana_name", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`芸人一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Artist[];
}

export async function getArtist(id: string): Promise<Artist | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`芸人情報の取得に失敗しました: ${error.message}`);
  }

  return (data ?? null) as Artist | null;
}
