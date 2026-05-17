"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import type { VideoFormState, VideoInput } from "@/lib/types/video";
import { extractYoutubeVideoId, YOUTUBE_ID_PATTERN } from "@/lib/utils/youtube";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  values: VideoInput;
  casts: CastEntry[];
  fieldErrors: VideoFormState["fieldErrors"];
} {
  const fieldErrors: VideoFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    fieldErrors.title = "タイトルを入力してください";
  } else if (title.length > 200) {
    fieldErrors.title = "200文字以内で入力してください";
  }

  const youtubeUrl = toNullableString(formData.get("youtube_url"));
  let youtubeVideoId = toNullableString(formData.get("youtube_video_id"));

  if (youtubeUrl && !youtubeVideoId) {
    youtubeVideoId = extractYoutubeVideoId(youtubeUrl);
  }

  if (youtubeVideoId && !YOUTUBE_ID_PATTERN.test(youtubeVideoId)) {
    fieldErrors.youtube_video_id = "YouTube動画IDの形式が不正です（11文字の英数字）";
    youtubeVideoId = null;
  }

  const values: VideoInput = {
    title,
    youtube_url: youtubeUrl,
    youtube_video_id: youtubeVideoId,
    youtube_channel_id: toNullableString(formData.get("youtube_channel_id")),
    thumbnail_url: toNullableString(formData.get("thumbnail_url")),
    published_at: toNullableString(formData.get("published_at")),
    description: toNullableString(formData.get("description")),
  };

  const { casts, error: castsError } = parseCasts(formData);
  if (castsError) {
    fieldErrors.casts = castsError;
  }

  return { values, casts, fieldErrors };
}

async function replaceCasts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  videoId: string,
  casts: CastEntry[]
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from("casts")
    .delete()
    .eq("content_type", "video")
    .eq("content_id", videoId);

  if (deleteError) {
    return { error: `出演者の削除に失敗しました: ${deleteError.message}` };
  }

  if (casts.length === 0) return {};

  const rows = casts.map((c) => ({
    content_type: "video",
    content_id: videoId,
    artist_id: c.type === "artist" ? c.id : null,
    comedy_group_id: c.type === "comedy_group" ? c.id : null,
    unit_id: c.type === "unit" ? c.id : null,
  }));

  const { error: insertError } = await supabase.from("casts").insert(rows);

  if (insertError) {
    return { error: `出演者の追加に失敗しました: ${insertError.message}` };
  }

  return {};
}

export async function createVideo(
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { data, error } = await supabase
    .from("videos")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: `動画の登録に失敗しました: ${error?.message ?? "unknown"}`,
    };
  }

  const castsResult = await replaceCasts(supabase, data.id, casts);
  if (castsResult.error) {
    return { error: castsResult.error };
  }

  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

export async function updateVideo(
  id: string,
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
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

  const { error, count } = await supabase
    .from("videos")
    .update(
      { ...values, updated_at: new Date().toISOString() },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { error: `動画の更新に失敗しました: ${error.message}` };
  }
  if (count !== 1) {
    return { error: "指定された動画が見つかりません" };
  }

  const castsResult = await replaceCasts(supabase, id, casts);
  if (castsResult.error) {
    return { error: castsResult.error };
  }

  revalidatePath("/admin/videos");
  revalidatePath(`/admin/videos/${id}/edit`);
  redirect("/admin/videos");
}

export async function deleteVideo(formData: FormData): Promise<void> {
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

  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    throw new Error(`動画の削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}
