"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { RadioInput } from "@/lib/types/radio";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RadioFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof RadioInput | "casts", string>>;
};

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseCasts(formData: FormData): {
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
    if (type !== "artist" && type !== "comedy_group" && type !== "unit") {
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

function parseFormData(formData: FormData): {
  values: RadioInput;
  casts: CastEntry[];
  fieldErrors: RadioFormState["fieldErrors"];
} {
  const fieldErrors: RadioFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "タイトルを入力してください";
  } else if (title.length > 200) {
    fieldErrors.title = "200文字以内で入力してください";
  }

  const values: RadioInput = {
    title,
    platform: toNullableString(formData.get("platform")),
    url: toNullableString(formData.get("url")),
    published_at: toNullableString(formData.get("published_at")),
    description: toNullableString(formData.get("description")),
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

async function replaceCasts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  radioId: string,
  casts: CastEntry[]
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from("radio_casts")
    .delete()
    .eq("radio_id", radioId);

  if (deleteError) {
    return { error: `出演者の削除に失敗しました: ${deleteError.message}` };
  }

  if (casts.length === 0) return {};

  const rows = casts.map((c) => ({
    radio_id: radioId,
    artist_id: c.type === "artist" ? c.id : null,
    comedy_group_id: c.type === "comedy_group" ? c.id : null,
    unit_id: c.type === "unit" ? c.id : null,
  }));

  const { error: insertError } = await supabase
    .from("radio_casts")
    .insert(rows);

  if (insertError) {
    return { error: `出演者の追加に失敗しました: ${insertError.message}` };
  }

  return {};
}

export async function createRadio(
  _prev: RadioFormState,
  formData: FormData
): Promise<RadioFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { data, error } = await supabase
    .from("radios")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: `ラジオの登録に失敗しました: ${error?.message ?? "unknown"}`,
    };
  }

  const castsResult = await replaceCasts(supabase, data.id, casts);
  if (castsResult.error) {
    return { error: castsResult.error };
  }

  revalidatePath("/admin/radios");
  redirect("/admin/radios");
}

export async function updateRadio(
  id: string,
  _prev: RadioFormState,
  formData: FormData
): Promise<RadioFormState> {
  if (!UUID_PATTERN.test(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase
    .from("radios")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `ラジオの更新に失敗しました: ${error.message}` };
  }

  const castsResult = await replaceCasts(supabase, id, casts);
  if (castsResult.error) {
    return { error: castsResult.error };
  }

  revalidatePath("/admin/radios");
  revalidatePath(`/admin/radios/${id}/edit`);
  redirect("/admin/radios");
}

export async function deleteRadio(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!UUID_PATTERN.test(id)) {
    throw new Error("IDが不正です");
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase.from("radios").delete().eq("id", id);

  if (error) {
    throw new Error(`ラジオの削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/radios");
  redirect("/admin/radios");
}
