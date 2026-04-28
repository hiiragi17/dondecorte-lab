"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentType } from "@/lib/types";
import type { MemoFormState } from "@/lib/types/memo";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONTENT_TYPES: ContentType[] = [
  "video",
  "live",
  "radio",
  "article",
  "tv_show",
  "topic",
];

const CONTENT_PATHS: Record<ContentType, { public: string; admin: string }> = {
  video: { public: "/videos", admin: "/admin/videos" },
  live: { public: "/lives", admin: "/admin/lives" },
  radio: { public: "/radios", admin: "/admin/radios" },
  article: { public: "/articles", admin: "/admin/articles" },
  tv_show: { public: "/tv", admin: "/admin/tv" },
  topic: { public: "/topics", admin: "/admin/topics" },
};

const MEMO_MAX_LENGTH = 2000;

function parseTargetType(value: FormDataEntryValue | null): ContentType | null {
  if (typeof value !== "string") return null;
  return CONTENT_TYPES.includes(value as ContentType)
    ? (value as ContentType)
    : null;
}

function revalidateTarget(targetType: ContentType, targetId: string) {
  const paths = CONTENT_PATHS[targetType];
  revalidatePath(`${paths.public}/${targetId}`);
  revalidatePath(`${paths.admin}/${targetId}/edit`);
}

export async function createMemo(
  _prev: MemoFormState,
  formData: FormData
): Promise<MemoFormState> {
  const targetType = parseTargetType(formData.get("target_type"));
  const targetId = String(formData.get("target_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!targetType) return { error: "対象種別が不正です" };
  if (!UUID_PATTERN.test(targetId)) return { error: "対象IDが不正です" };
  if (!content) return { fieldError: "メモを入力してください" };
  if (content.length > MEMO_MAX_LENGTH) {
    return { fieldError: `${MEMO_MAX_LENGTH}文字以内で入力してください` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "認証が必要です" };

  const { error } = await supabase.from("memos").insert({
    target_type: targetType,
    target_id: targetId,
    content,
  });

  if (error) {
    return { error: `メモの登録に失敗しました: ${error.message}` };
  }

  revalidateTarget(targetType, targetId);
  return {};
}

export async function updateMemo(
  _prev: MemoFormState,
  formData: FormData
): Promise<MemoFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const targetType = parseTargetType(formData.get("target_type"));
  const targetId = String(formData.get("target_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!UUID_PATTERN.test(id)) return { error: "メモIDが不正です" };
  if (!targetType) return { error: "対象種別が不正です" };
  if (!UUID_PATTERN.test(targetId)) return { error: "対象IDが不正です" };
  if (!content) return { fieldError: "メモを入力してください" };
  if (content.length > MEMO_MAX_LENGTH) {
    return { fieldError: `${MEMO_MAX_LENGTH}文字以内で入力してください` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "認証が必要です" };

  const { data, error } = await supabase
    .from("memos")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("target_type, target_id")
    .maybeSingle();

  if (error) {
    return { error: `メモの更新に失敗しました: ${error.message}` };
  }
  if (!data) {
    return { error: "対象のメモが見つかりませんでした" };
  }

  revalidateTarget(data.target_type as ContentType, data.target_id as string);
  return {};
}

export async function deleteMemo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();

  if (!UUID_PATTERN.test(id)) throw new Error("メモIDが不正です");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("認証が必要です");

  const { data, error } = await supabase
    .from("memos")
    .delete()
    .eq("id", id)
    .select("target_type, target_id")
    .maybeSingle();

  if (error) {
    throw new Error(`メモの削除に失敗しました: ${error.message}`);
  }
  if (!data) {
    throw new Error("対象のメモが見つかりませんでした");
  }

  revalidateTarget(data.target_type as ContentType, data.target_id as string);
}
