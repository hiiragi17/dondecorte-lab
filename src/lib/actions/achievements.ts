"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AchievementInput, AchievementTargetType } from "@/lib/types/achievement";

export type AchievementFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<keyof AchievementInput | "target_type" | "target_id", string>
  >;
};

const TARGET_TYPES: AchievementTargetType[] = [
  "artist",
  "comedy_group",
  "unit",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseFormData(formData: FormData): {
  values: AchievementInput;
  fieldErrors: AchievementFormState["fieldErrors"];
} {
  const fieldErrors: AchievementFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "タイトルを入力してください";
  } else if (title.length > 200) {
    fieldErrors.title = "200文字以内で入力してください";
  }

  const result = String(formData.get("result") ?? "").trim();
  if (!result) {
    fieldErrors.result = "結果を入力してください";
  } else if (result.length > 100) {
    fieldErrors.result = "100文字以内で入力してください";
  }

  const yearRaw = String(formData.get("year") ?? "").trim();
  let year = 0;
  if (!yearRaw) {
    fieldErrors.year = "年を入力してください";
  } else {
    const parsed = Number(yearRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
      fieldErrors.year = "1900〜2100の整数で入力してください";
    } else {
      year = parsed;
    }
  }

  const sortOrderRaw = String(formData.get("sort_order") ?? "").trim();
  let sortOrderVal = 0;
  if (!sortOrderRaw) {
    fieldErrors.sort_order = "表示順を入力してください";
  } else {
    const parsedSortOrder = Number(sortOrderRaw);
    if (!Number.isInteger(parsedSortOrder)) {
      fieldErrors.sort_order = "表示順は整数で入力してください";
    } else {
      sortOrderVal = parsedSortOrder;
    }
  }

  const targetType = String(formData.get("target_type") ?? "").trim();
  if (!(TARGET_TYPES as string[]).includes(targetType)) {
    fieldErrors.target_type = "対象種別を選択してください";
  }

  const targetId = String(formData.get("target_id") ?? "").trim();
  if (!targetId) {
    fieldErrors.target_id = "対象を選択してください";
  } else if (!UUID_PATTERN.test(targetId)) {
    fieldErrors.target_id = "対象のIDが不正です";
  }

  const values: AchievementInput = {
    artist_id: targetType === "artist" ? targetId : null,
    comedy_group_id: targetType === "comedy_group" ? targetId : null,
    unit_id: targetType === "unit" ? targetId : null,
    title,
    result,
    year,
    sort_order: sortOrderVal,
  };

  return { values, fieldErrors };
}

export async function createAchievement(
  _prev: AchievementFormState,
  formData: FormData
): Promise<AchievementFormState> {
  const { values, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase.from("achievements").insert(values);

  if (error) {
    return {
      error: `受賞歴の登録に失敗しました: ${error.message}`,
    };
  }

  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

export async function updateAchievement(
  id: string,
  _prev: AchievementFormState,
  formData: FormData
): Promise<AchievementFormState> {
  if (!UUID_PATTERN.test(id)) {
    return { error: "IDが不正です" };
  }

  const { values, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase
    .from("achievements")
    .update(values)
    .eq("id", id);

  if (error) {
    return { error: `受賞歴の更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}/edit`);
  redirect("/admin/achievements");
}

export async function deleteAchievement(formData: FormData): Promise<void> {
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

  const { error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`受賞歴の削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}
