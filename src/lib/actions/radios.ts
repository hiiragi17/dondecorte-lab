"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import { isUuid, toNullableString, validateTitle } from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { RadioFormState, RadioInput } from "@/lib/types/radio";

function parseFormData(formData: FormData): {
  values: RadioInput;
  casts: CastEntry[];
  fieldErrors: RadioFormState["fieldErrors"];
} {
  const fieldErrors: RadioFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
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

export async function createRadio(
  _prev: RadioFormState,
  formData: FormData
): Promise<RadioFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "radio",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/radios");
  redirect("/admin/radios");
}

export async function updateRadio(
  id: string,
  _prev: RadioFormState,
  formData: FormData
): Promise<RadioFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "radio",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/radios");
  revalidatePath(`/admin/radios/${id}/edit`);
  redirect("/admin/radios");
}

export async function deleteRadio(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "radio", id });

  revalidatePath("/admin/radios");
  redirect("/admin/radios");
}
