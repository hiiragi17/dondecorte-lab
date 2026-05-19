"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import { isUuid, toNullableString, validateTitle } from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { TvShowFormState, TvShowInput } from "@/lib/types/tv-show";

function parseFormData(formData: FormData): {
  values: TvShowInput;
  casts: CastEntry[];
  fieldErrors: TvShowFormState["fieldErrors"];
} {
  const fieldErrors: TvShowFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
  }

  const values: TvShowInput = {
    title,
    network: toNullableString(formData.get("network")),
    air_date: toNullableString(formData.get("air_date")),
    air_time: toNullableString(formData.get("air_time")),
    description: toNullableString(formData.get("description")),
    url: toNullableString(formData.get("url")),
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

export async function createTvShow(
  _prev: TvShowFormState,
  formData: FormData
): Promise<TvShowFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "tv_show",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/tv");
  redirect("/admin/tv");
}

export async function updateTvShow(
  id: string,
  _prev: TvShowFormState,
  formData: FormData
): Promise<TvShowFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "tv_show",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/tv");
  revalidatePath(`/admin/tv/${id}/edit`);
  redirect("/admin/tv");
}

export async function deleteTvShow(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "tv_show", id });

  revalidatePath("/admin/tv");
  redirect("/admin/tv");
}
