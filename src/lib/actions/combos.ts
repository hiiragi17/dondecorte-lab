"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ComboGroupType,
  ComboInput,
  ComboMemberInput,
} from "@/lib/types/combo";

export type ComboFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ComboInput | "members", string>>;
};

type ComboUrlField =
  | "image_url"
  | "x_url"
  | "instagram_url"
  | "note_url"
  | "youtube_channel_url"
  | "standfm_url"
  | "tiktok_url"
  | "website_url";

const URL_FIELDS: ComboUrlField[] = [
  "image_url",
  "x_url",
  "instagram_url",
  "note_url",
  "youtube_channel_url",
  "standfm_url",
  "tiktok_url",
  "website_url",
];

const GROUP_TYPES: ComboGroupType[] = ["combo", "trio", "quartet", "other"];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseMembers(formData: FormData): {
  members: ComboMemberInput[];
  error?: string;
} {
  const artistIds = formData.getAll("member_artist_id").map((v) => String(v));
  const roles = formData.getAll("member_role").map((v) => String(v));

  const members: ComboMemberInput[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < artistIds.length; i += 1) {
    const artistId = artistIds[i]?.trim();
    if (!artistId) continue;
    if (!UUID_PATTERN.test(artistId)) {
      return { members: [], error: "メンバーのIDが不正です" };
    }
    if (seen.has(artistId)) {
      return { members: [], error: "同じ芸人を複数回追加できません" };
    }
    seen.add(artistId);

    const rawRole = roles[i] ?? "";
    const trimmedRole = typeof rawRole === "string" ? rawRole.trim() : "";
    members.push({
      artist_id: artistId,
      role: trimmedRole === "" ? null : trimmedRole,
    });
  }
  return { members };
}

function parseFormData(formData: FormData): {
  values: ComboInput;
  members: ComboMemberInput[];
  fieldErrors: ComboFormState["fieldErrors"];
} {
  const fieldErrors: ComboFormState["fieldErrors"] = {};

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    fieldErrors.name = "名前を入力してください";
  } else if (name.length > 100) {
    fieldErrors.name = "100文字以内で入力してください";
  }

  const kanaName = toNullableString(formData.get("kana_name"));
  if (kanaName !== null && kanaName.length > 100) {
    fieldErrors.kana_name = "100文字以内で入力してください";
  }

  const groupTypeRaw = String(formData.get("group_type") ?? "combo").trim();
  const groupType = (GROUP_TYPES as string[]).includes(groupTypeRaw)
    ? (groupTypeRaw as ComboGroupType)
    : "combo";
  if (!(GROUP_TYPES as string[]).includes(groupTypeRaw)) {
    fieldErrors.group_type = "種別を選択してください";
  }

  const formedYearRaw = toNullableString(formData.get("formed_year"));
  let formedYear: number | null = null;
  if (formedYearRaw !== null) {
    const parsed = Number(formedYearRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
      fieldErrors.formed_year = "結成年は1900〜2100の整数で入力してください";
    } else {
      formedYear = parsed;
    }
  }

  const themeColor = toNullableString(formData.get("theme_color"));
  if (themeColor !== null && !HEX_COLOR_PATTERN.test(themeColor)) {
    fieldErrors.theme_color = "#RRGGBB 形式で入力してください";
  }

  const values: ComboInput = {
    name,
    kana_name: kanaName,
    group_type: groupType,
    description: toNullableString(formData.get("description")),
    formed_year: formedYear,
    image_url: toNullableString(formData.get("image_url")),
    theme_color: themeColor,
    x_url: toNullableString(formData.get("x_url")),
    instagram_url: toNullableString(formData.get("instagram_url")),
    note_url: toNullableString(formData.get("note_url")),
    youtube_channel_url: toNullableString(formData.get("youtube_channel_url")),
    youtube_channel_id: toNullableString(formData.get("youtube_channel_id")),
    standfm_url: toNullableString(formData.get("standfm_url")),
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

  const { members, error: membersError } = parseMembers(formData);
  if (membersError) {
    fieldErrors.members = membersError;
  }

  return { values, members, fieldErrors };
}

async function replaceMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  comboId: string,
  members: ComboMemberInput[]
): Promise<{ error?: string }> {
  // 既存メンバーの全削除と新規メンバーの挿入をサーバ側で
  // 単一トランザクションとして実行する RPC を呼ぶ。
  // （Supabase クライアントはトランザクションを直接扱えないため）
  const payload = members.map((m) => ({
    artist_id: m.artist_id,
    role: m.role ?? "",
  }));
  const { error } = await supabase.rpc("replace_comedy_group_members", {
    p_comedy_group_id: comboId,
    p_members: payload,
  });
  if (error) {
    return { error: `メンバーの更新に失敗しました: ${error.message}` };
  }
  return {};
}

export async function createCombo(
  _prev: ComboFormState,
  formData: FormData
): Promise<ComboFormState> {
  const { values, members, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comedy_groups")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: `コンビの登録に失敗しました: ${error?.message ?? "unknown"}`,
    };
  }

  const membersResult = await replaceMembers(supabase, data.id, members);
  if (membersResult.error) {
    return { error: membersResult.error };
  }

  revalidatePath("/admin/combos");
  redirect("/admin/combos");
}

export async function updateCombo(
  id: string,
  _prev: ComboFormState,
  formData: FormData
): Promise<ComboFormState> {
  const { values, members, fieldErrors } = parseFormData(formData);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comedy_groups")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `コンビの更新に失敗しました: ${error.message}` };
  }

  const membersResult = await replaceMembers(supabase, id, members);
  if (membersResult.error) {
    return { error: membersResult.error };
  }

  revalidatePath("/admin/combos");
  revalidatePath(`/admin/combos/${id}/edit`);
  redirect("/admin/combos");
}

export async function deleteCombo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("comedy_groups").delete().eq("id", id);

  if (error) {
    throw new Error(`コンビの削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/admin/combos");
  revalidatePath(`/admin/combos/${id}/edit`);
  redirect("/admin/combos");
}
