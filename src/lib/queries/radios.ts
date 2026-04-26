import { createClient } from "@/lib/supabase/server";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import type { Radio, RadioWithCasts } from "@/lib/types/radio";

function toRadioBase(row: Record<string, unknown>): Radio {
  return {
    id: row.id as string,
    title: row.title as string,
    platform: (row.platform as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listRadios(): Promise<Radio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("radios")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ラジオ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Radio[];
}

export async function listRadiosWithCasts(): Promise<RadioWithCasts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("radios")
    .select(
      `*,
       radio_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ラジオ一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const casts = mapCasts(record.radio_casts as CastRow[] | null | undefined);
    return { ...toRadioBase(record), casts };
  });
}

export async function getRadio(id: string): Promise<RadioWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("radios")
    .select(
      `*,
       radio_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`ラジオ情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const record = data as Record<string, unknown>;
  const casts = mapCasts(record.radio_casts as CastRow[] | null | undefined);
  return { ...toRadioBase(record), casts };
}
