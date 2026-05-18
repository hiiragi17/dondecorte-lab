"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { LiveFormState, LiveInput } from "@/lib/types/live";
import { upsertContentWithCasts } from "./casts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidEventDate(value: string): boolean {
  const match = EVENT_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
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
  values: LiveInput;
  casts: CastEntry[];
  fieldErrors: LiveFormState["fieldErrors"];
} {
  const fieldErrors: LiveFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "タイトルを入力してください";
  } else if (title.length > 200) {
    fieldErrors.title = "200文字以内で入力してください";
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

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const result = await upsertContentWithCasts(supabase, {
    contentType: "live",
    contentId: null,
    content: values,
    casts,
  });
  if (result.error) {
    return { error: `ライブの登録に失敗しました: ${result.error}` };
  }

  revalidatePath("/admin/lives");
  redirect("/admin/lives");
}

export async function updateLive(
  id: string,
  _prev: LiveFormState,
  formData: FormData
): Promise<LiveFormState> {
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
    contentType: "live",
    contentId: id,
    content: values,
    casts,
  });
  if (result.error) {
    return {
      error: result.notFound
        ? "指定されたライブが見つかりません"
        : `ライブの更新に失敗しました: ${result.error}`,
    };
  }

  revalidatePath("/admin/lives");
  revalidatePath(`/admin/lives/${id}/edit`);
  redirect("/admin/lives");
}

export async function deleteLive(formData: FormData): Promise<void> {
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

  const { error, count } = await supabase
    .from("lives")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    throw new Error(`ライブの削除に失敗しました: ${error.message}`);
  }
  if (count !== 1) {
    throw new Error("指定されたライブが見つかりません");
  }

  revalidatePath("/admin/lives");
  redirect("/admin/lives");
}
