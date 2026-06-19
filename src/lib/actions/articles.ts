"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import {
  isUuid,
  isValidHttpUrl,
  toNullableString,
  validateTitle,
} from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { ArticleFormState, ArticleInput } from "@/lib/types/article";

const CONTENT_MAX_LENGTH = 500;

function parseFormData(formData: FormData): {
  values: ArticleInput;
  casts: CastEntry[];
  fieldErrors: ArticleFormState["fieldErrors"];
} {
  const fieldErrors: ArticleFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
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

  const result = await saveContentWithCasts({
    contentType: "article",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function updateArticle(
  id: string,
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "article",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}/edit`);
  redirect("/admin/articles");
}

export async function deleteArticle(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "article", id });

  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}
