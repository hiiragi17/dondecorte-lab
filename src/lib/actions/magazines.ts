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
import type { MagazineFormState, MagazineInput } from "@/lib/types/magazine";

function parseFormData(formData: FormData): {
  values: MagazineInput;
  casts: CastEntry[];
  fieldErrors: MagazineFormState["fieldErrors"];
} {
  const fieldErrors: MagazineFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
  }

  const values: MagazineInput = {
    title,
    magazine_name: toNullableString(formData.get("magazine_name")),
    issue: toNullableString(formData.get("issue")),
    publisher: toNullableString(formData.get("publisher")),
    url: toNullableString(formData.get("url")),
    published_on: toNullableString(formData.get("published_on")),
    description: toNullableString(formData.get("description")),
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

export async function createMagazine(
  _prev: MagazineFormState,
  formData: FormData
): Promise<MagazineFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "magazine",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/magazines");
  redirect("/admin/magazines");
}

export async function updateMagazine(
  id: string,
  _prev: MagazineFormState,
  formData: FormData
): Promise<MagazineFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "magazine",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/magazines");
  revalidatePath(`/admin/magazines/${id}/edit`);
  redirect("/admin/magazines");
}

export async function deleteMagazine(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "magazine", id });

  revalidatePath("/admin/magazines");
  redirect("/admin/magazines");
}
