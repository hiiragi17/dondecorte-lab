"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { ArticleFormState, ArticleInput } from "@/lib/types/article";
import { upsertContentWithCasts } from "./casts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONTENT_MAX_LENGTH = 500;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
  values: ArticleInput;
  casts: CastEntry[];
  fieldErrors: ArticleFormState["fieldErrors"];
} {
  const fieldErrors: ArticleFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "タイトルを入力してください";
  } else if (title.length > 200) {
    fieldErrors.title = "200文字以内で入力してください";
  }

  const url = toNullableString(formData.get("url"));
  if (!url) {
    fieldErrors.url = "URLを入力してください";
  } else if (!isValidHttpUrl(url)) {
    fieldErrors.url = "URLの形式が不正です（http/https のみ）";
  }

  const content = toNullableString(formData.get("content"));
  if (content && content.length > CONTENT_MAX_LENGTH) {
    fieldErrors.content = `本文の転載は禁止です。要約のみ${CONTENT_MAX_LENGTH}文字以内で入力してください`;
  }

  const values: ArticleInput = {
    title,
    url,
    source: toNullableString(formData.get("source")),
    published_at: toNullableString(formData.get("published_at")),
    content,
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

export async function createArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const result = await upsertContentWithCasts(supabase, {
    contentType: "article",
    contentId: null,
    content: values,
    casts,
  });
  if (result.error) {
    return { error: `記事の登録に失敗しました: ${result.error}` };
  }

  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function updateArticle(
  id: string,
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
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

  const result = await upsertContentWithCasts(supabase, {
    contentType: "article",
    contentId: id,
    content: values,
    casts,
  });
  if (result.error) {
    return {
      error: result.notFound
        ? "指定された記事が見つかりません"
        : `記事の更新に失敗しました: ${result.error}`,
    };
  }

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}/edit`);
  redirect("/admin/articles");
}

export async function deleteArticle(formData: FormData): Promise<void> {
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

  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    throw new Error(`記事の削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}
