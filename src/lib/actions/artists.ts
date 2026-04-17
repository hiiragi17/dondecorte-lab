"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ArtistInput } from "@/lib/types/artist";

export type ArtistFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ArtistInput, string>>;
};

type ArtistUrlField =
  | "image_url"
  | "x_url"
  | "instagram_url"
  | "note_url"
  | "youtube_channel_url"
  | "tiktok_url"
  | "website_url";

const URL_FIELDS: ArtistUrlField[] = [
  "image_url",
  "x_url",
  "instagram_url",
  "note_url",
  "youtube_channel_url",
  "tiktok_url",
  "website_url",
];

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseFormData(formData: FormData): {
  values: ArtistInput;
  fieldErrors: ArtistFormState["fieldErrors"];
} {
  const fieldErrors: ArtistFormState["fieldErrors"] = {};

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    fieldErrors.name = "名前を入力してください";
  }

  const debutYearRaw = toNullableString(formData.get("debut_year"));
  let debutYear: number | null = null;
  if (debutYearRaw !== null) {
    const parsed = Number(debutYearRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
      fieldErrors.debut_year = "デビュー年は1900〜2100の整数で入力してください";
    } else {
      debutYear = parsed;
    }
  }

  const values: ArtistInput = {
    name,
    kana_name: toNullableString(formData.get("kana_name")),
    profile: toNullableString(formData.get("profile")),
    debut_year: debutYear,
    image_url: toNullableString(formData.get("image_url")),
    x_url: toNullableString(formData.get("x_url")),
    instagram_url: toNullableString(formData.get("instagram_url")),
    note_url: toNullableString(formData.get("note_url")),
    youtube_channel_url: toNullableString(formData.get("youtube_channel_url")),
    tiktok_url: toNullableString(formData.get("tiktok_url")),
    website_url: toNullableString(formData.get("website_url")),
  };

  for (const key of URL_FIELDS) {
    const value = values[key];
    if (value === null) continue;
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        fieldErrors[key] = "http(s)のURLを入力してください";
      }
    } catch {
      fieldErrors[key] = "正しいURL形式で入力してください";
    }
  }

  return { values, fieldErrors };
}

export async function createArtist(
  _prev: ArtistFormState,
  formData: FormData
): Promise<ArtistFormState> {
  const { values, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("artists").insert(values);

  if (error) {
    return { error: `芸人の登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/artists");
  redirect("/admin/artists");
}

export async function updateArtist(
  id: string,
  _prev: ArtistFormState,
  formData: FormData
): Promise<ArtistFormState> {
  const { values, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("artists")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `芸人の更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/artists");
  revalidatePath(`/admin/artists/${id}/edit`);
  redirect("/admin/artists");
}

export async function deleteArtist(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("artists").delete().eq("id", id);

  if (error) {
    throw new Error(`芸人の削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/artists");
}
