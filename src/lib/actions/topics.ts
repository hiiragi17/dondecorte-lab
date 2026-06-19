"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import { isUuid, toNullableString, validateTitle } from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { TopicFormState, TopicInput } from "@/lib/types/topic";

function parseFormData(formData: FormData): {
  values: TopicInput;
  casts: CastEntry[];
  fieldErrors: TopicFormState["fieldErrors"];
} {
  const fieldErrors: TopicFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
  }

  const values: TopicInput = {
    title,
    content: toNullableString(formData.get("content")),
    url: toNullableString(formData.get("url")),
    source: toNullableString(formData.get("source")),
    topic_date: toNullableString(formData.get("topic_date")),
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

export async function createTopic(
  _prev: TopicFormState,
  formData: FormData
): Promise<TopicFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "topic",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/topics");
  redirect("/admin/topics");
}

export async function updateTopic(
  id: string,
  _prev: TopicFormState,
  formData: FormData
): Promise<TopicFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "topic",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/topics");
  revalidatePath(`/admin/topics/${id}/edit`);
  redirect("/admin/topics");
}

export async function deleteTopic(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "topic", id });

  revalidatePath("/admin/topics");
  redirect("/admin/topics");
}
