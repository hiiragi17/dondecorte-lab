"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import {
  isUuid,
  isValidEventDate,
  toNullableString,
  validateTitle,
} from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { LiveFormState, LiveInput } from "@/lib/types/live";

function parseFormData(formData: FormData): {
  values: LiveInput;
  casts: CastEntry[];
  fieldErrors: LiveFormState["fieldErrors"];
} {
  const fieldErrors: LiveFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
  }

  const event_date = toNullableString(formData.get("event_date"));
  if (event_date && !isValidEventDate(event_date)) {
    fieldErrors.event_date = "開催日はYYYY-MM-DD形式で入力してください";
  }

  const startTimeInput = String(formData.get("start_time") ?? "").trim();
  const start_time =
    event_date && startTimeInput ? `${event_date}T${startTimeInput}:00` : null;

  const values: LiveInput = {
    title,
    event_date,
    start_time,
    venue: toNullableString(formData.get("venue")),
    description: toNullableString(formData.get("description")),
    url: toNullableString(formData.get("url")),
    is_notified: formData.get("is_notified") === "true",
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

export async function createLive(
  _prev: LiveFormState,
  formData: FormData
): Promise<LiveFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "live",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/lives");
  redirect("/admin/lives");
}

export async function updateLive(
  id: string,
  _prev: LiveFormState,
  formData: FormData
): Promise<LiveFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "live",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/lives");
  revalidatePath(`/admin/lives/${id}/edit`);
  redirect("/admin/lives");
}

export async function deleteLive(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "live", id });

  revalidatePath("/admin/lives");
  redirect("/admin/lives");
}
