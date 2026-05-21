"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TagInput } from "@/lib/types/tag";

export type TagFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof TagInput, string>>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function uniqueViolationFieldErrors(error: {
  message: string;
  details?: string | null;
}): TagFormState["fieldErrors"] {
  const detail = `${error.message} ${error.details ?? ""}`;
  if (detail.includes("tags_slug_key") || detail.includes("(slug)")) {
    return { slug: "同じスラッグのタグが既に存在します" };
  }
  return { name: "同じ名前のタグが既に存在します" };
}

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseFormData(formData: FormData): {
  values: TagInput;
  fieldErrors: TagFormState["fieldErrors"];
} {
  const fieldErrors: TagFormState["fieldErrors"] = {};

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    fieldErrors.name = "タグ名を入力してください";
  } else if (name.length > 50) {
    fieldErrors.name = "50文字以内で入力してください";
  }

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) {
    fieldErrors.slug = "スラッグを入力してください";
  } else if (slug.length > 50) {
    fieldErrors.slug = "50文字以内で入力してください";
  } else if (!SLUG_PATTERN.test(slug)) {
    fieldErrors.slug = "半角英数字とハイフンのみ使用できます（例: m-1-grand-prix）";
  }

  const description = toNullableString(formData.get("description"));
  if (description !== null && description.length > 200) {
    fieldErrors.description = "200文字以内で入力してください";
  }

  const color = toNullableString(formData.get("color"));
  if (color !== null && !COLOR_PATTERN.test(color)) {
    fieldErrors.color = "#RGB または #RRGGBB の形式で入力してください";
  }

  const values: TagInput = {
    name,
    slug,
    description,
    color,
  };

  return { values, fieldErrors };
}

export async function createTag(
  _prev: TagFormState,
  formData: FormData
): Promise<TagFormState> {
  const { values, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase.from("tags").insert(values);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: uniqueViolationFieldErrors(error) };
    }
    return { error: `タグの登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function updateTag(
  id: string,
  _prev: TagFormState,
  formData: FormData
): Promise<TagFormState> {
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

  const { data, error } = await supabase
    .from("tags")
    .update(values)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: uniqueViolationFieldErrors(error) };
    }
    return { error: `タグの更新に失敗しました: ${error.message}` };
  }
  if (!data) {
    return { error: "対象のタグが見つかりません" };
  }

  revalidatePath("/admin/tags");
  revalidatePath(`/admin/tags/${id}/edit`);
  redirect("/admin/tags");
}

export async function deleteTag(formData: FormData): Promise<void> {
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

  const { data, error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`タグの削除に失敗しました: ${error.message}`);
  }
  if (!data) {
    throw new Error("対象のタグが見つかりません");
  }

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}
