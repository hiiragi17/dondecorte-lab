"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import {
  deleteContent,
  saveContentWithCasts,
} from "@/lib/services/content-service";
import {
  isUuid,
  toNullableString,
  validateTitle,
} from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { CmFormState, CmInput } from "@/lib/types/cm";

function parseFormData(formData: FormData): {
  values: CmInput;
  casts: CastEntry[];
  fieldErrors: CmFormState["fieldErrors"];
} {
  const fieldErrors: CmFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
  }

  const values: CmInput = {
    title,
    advertiser: toNullableString(formData.get("advertiser")),
    product: toNullableString(formData.get("product")),
    url: toNullableString(formData.get("url")),
    aired_on: toNullableString(formData.get("aired_on")),
    description: toNullableString(formData.get("description")),
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

export async function createCm(
  _prev: CmFormState,
  formData: FormData
): Promise<CmFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "cm",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/cms");
  redirect("/admin/cms");
}

export async function updateCm(
  id: string,
  _prev: CmFormState,
  formData: FormData
): Promise<CmFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "cm",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/cms");
  revalidatePath(`/admin/cms/${id}/edit`);
  redirect("/admin/cms");
}

export async function deleteCm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "cm", id });

  revalidatePath("/admin/cms");
  redirect("/admin/cms");
}
