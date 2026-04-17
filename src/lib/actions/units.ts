"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UnitInput, UnitMemberEntry } from "@/lib/types/unit";

export type UnitFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof UnitInput | "members", string>>;
};

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseMembers(formData: FormData): {
  members: UnitMemberEntry[];
  error?: string;
} {
  const types = formData.getAll("member_type").map((v) => String(v));
  const ids = formData.getAll("member_id").map((v) => String(v));
  const names = formData.getAll("member_name").map((v) => String(v));

  const members: UnitMemberEntry[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < types.length; i += 1) {
    const type = types[i]?.trim();
    const id = ids[i]?.trim();
    const name = names[i]?.trim() ?? "";

    if (!type || !id) continue;
    if (type !== "comedy_group" && type !== "artist") {
      return { members: [], error: "メンバーの種別が不正です" };
    }

    const key = `${type}:${id}`;
    if (seen.has(key)) {
      return { members: [], error: "同じメンバーを複数回追加できません" };
    }
    seen.add(key);

    members.push({ type, id, name, kana_name: null });
  }

  return { members };
}

function parseFormData(formData: FormData): {
  values: UnitInput;
  members: UnitMemberEntry[];
  fieldErrors: UnitFormState["fieldErrors"];
} {
  const fieldErrors: UnitFormState["fieldErrors"] = {};

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    fieldErrors.name = "名前を入力してください";
  } else if (name.length > 100) {
    fieldErrors.name = "100文字以内で入力してください";
  }

  const values: UnitInput = {
    name,
    description: toNullableString(formData.get("description")),
  };

  const { members, error: membersError } = parseMembers(formData);
  if (membersError) {
    fieldErrors.members = membersError;
  }

  return { values, members, fieldErrors };
}

async function replaceUnitMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  unitId: string,
  members: UnitMemberEntry[]
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from("unit_members")
    .delete()
    .eq("unit_id", unitId);

  if (deleteError) {
    return { error: `メンバーの削除に失敗しました: ${deleteError.message}` };
  }

  if (members.length === 0) return {};

  const rows = members.map((m) => ({
    unit_id: unitId,
    comedy_group_id: m.type === "comedy_group" ? m.id : null,
    artist_id: m.type === "artist" ? m.id : null,
  }));

  const { error: insertError } = await supabase
    .from("unit_members")
    .insert(rows);

  if (insertError) {
    return { error: `メンバーの追加に失敗しました: ${insertError.message}` };
  }

  return {};
}

export async function createUnit(
  _prev: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  const { values, members, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { data, error } = await supabase
    .from("units")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: `ユニットの登録に失敗しました: ${error?.message ?? "unknown"}`,
    };
  }

  const membersResult = await replaceUnitMembers(supabase, data.id, members);
  if (membersResult.error) {
    return { error: membersResult.error };
  }

  revalidatePath("/admin/units");
  redirect("/admin/units");
}

export async function updateUnit(
  id: string,
  _prev: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  const { values, members, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase
    .from("units")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `ユニットの更新に失敗しました: ${error.message}` };
  }

  const membersResult = await replaceUnitMembers(supabase, id, members);
  if (membersResult.error) {
    return { error: membersResult.error };
  }

  revalidatePath("/admin/units");
  revalidatePath(`/admin/units/${id}/edit`);
  redirect("/admin/units");
}

export async function deleteUnit(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase.from("units").delete().eq("id", id);

  if (error) {
    throw new Error(`ユニットの削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/units");
  redirect("/admin/units");
}
