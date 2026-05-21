"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AchievementInput,
  AchievementTargetType,
} from "@/lib/types/achievement";

type AchievementBaseInputRow = {
  title: string;
  result: string;
  year: number;
  sort_order: number;
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
};

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
  values: AchievementInput | null;
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

  if (Object.keys(fieldErrors).length > 0) {
    return { values: null, fieldErrors };
  }

  // ここまでで targetType は TARGET_TYPES のいずれかであることが保証される。
  // AchievementInput は対象1種のみ非nullの判別共用体なので分岐して組み立てる。
  let values: AchievementInput;
  if (targetType === "comedy_group") {
    values = {
      title,
      result,
      year,
      sort_order: sortOrderVal,
      artist_id: null,
      comedy_group_id: targetId,
      unit_id: null,
    };
  } else if (targetType === "unit") {
    values = {
      title,
      result,
      year,
      sort_order: sortOrderVal,
      artist_id: null,
      comedy_group_id: null,
      unit_id: targetId,
    };
  } else {
    values = {
      title,
      result,
      year,
      sort_order: sortOrderVal,
      artist_id: targetId,
      comedy_group_id: null,
      unit_id: null,
    };
  }

  return { values, fieldErrors };
}

export async function createAchievement(
  _prev: AchievementFormState,
  formData: FormData
): Promise<AchievementFormState> {
  const { values, fieldErrors } = parseFormData(formData);
  if (!values) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  // AchievementInput は discriminated union だが Supabase の insert 型は
  // union の最初のアームに固定されてしまうため、DB の行型 (1 列だけ非 NULL は
  // CHECK 制約で担保) に合わせて nullable に広げて渡す。
  const insertPayload: AchievementBaseInputRow = values;
  const { error } = await supabase
    .from("achievements")
    .insert(insertPayload);

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
  if (!values) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const updatePayload: AchievementBaseInputRow = values;
  const { error } = await supabase
    .from("achievements")
    .update(updatePayload)
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
