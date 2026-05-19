"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCasts } from "@/lib/services/casts";
import { deleteContent, saveContentWithCasts } from "@/lib/services/content-service";
import { isUuid, toNullableString, validateTitle } from "@/lib/services/validation";
import type { CastEntry } from "@/lib/types";
import type { VideoFormState, VideoInput } from "@/lib/types/video";
import { extractYoutubeVideoId, YOUTUBE_ID_PATTERN } from "@/lib/utils/youtube";

function parseFormData(formData: FormData): {
  values: VideoInput;
  casts: CastEntry[];
  fieldErrors: VideoFormState["fieldErrors"];
} {
  const fieldErrors: VideoFormState["fieldErrors"] = {};

  const title = String(formData.get("title") ?? "").trim();
  const titleError = validateTitle(title);
  if (titleError) {
    fieldErrors.title = titleError;
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

export async function createVideo(
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "video",
    contentId: null,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

export async function updateVideo(
  id: string,
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  if (!isUuid(id)) {
    return { error: "IDが不正です" };
  }

  const { values, casts, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveContentWithCasts({
    contentType: "video",
    contentId: id,
    values,
    casts,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/videos");
  revalidatePath(`/admin/videos/${id}/edit`);
  redirect("/admin/videos");
}

export async function deleteVideo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!isUuid(id)) {
    throw new Error("IDが不正です");
  }

  await deleteContent({ contentType: "video", id });

  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}
