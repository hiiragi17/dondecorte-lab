"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import {
  parseLiveSchedules,
  replaceLiveSchedules,
} from "@/lib/services/live-schedules";
import {
  isUuid,
  isValidEventDate,
  toNullableString,
  validateTitle,
} from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type {
  LiveFormState,
  LiveInput,
  LiveScheduleInput,
} from "@/lib/types/live";

function parseFormData(formData: FormData): {
  values: LiveInput;
  casts: CastEntry[];
  schedules: LiveScheduleInput[];
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

  const { schedules, error: schedulesError } = parseLiveSchedules(formData);
  if (schedulesError) {
    fieldErrors.schedules = schedulesError;
  }

  return { values, casts, schedules, fieldErrors };
}

export async function createLive(
  _prev: LiveFormState,
  formData: FormData
): Promise<LiveFormState> {
  const { values, casts, schedules, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "live",
    contentId: null,
    values,
    casts,
  });
  if (result.error || !result.id) {
    return { error: result.error ?? "ライブの登録に失敗しました" };
  }

  const supabase = await createClient();
  const scheduleResult = await replaceLiveSchedules(
    supabase,
    result.id,
    schedules
  );
  if (scheduleResult.error) {
    return {
      error: `チケットスケジュールの保存に失敗しました: ${scheduleResult.error}`,
    };
  }

  revalidatePath("/admin/lives");
  revalidatePath("/calendar");
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

  const { values, casts, schedules, fieldErrors } = parseFormData(formData);
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

  const supabase = await createClient();
  const scheduleResult = await replaceLiveSchedules(supabase, id, schedules);
  if (scheduleResult.error) {
    return {
      error: `チケットスケジュールの保存に失敗しました: ${scheduleResult.error}`,
    };
  }

  revalidatePath("/admin/lives");
  revalidatePath(`/admin/lives/${id}/edit`);
  revalidatePath("/calendar");
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
  revalidatePath("/calendar");
  redirect("/admin/lives");
}
