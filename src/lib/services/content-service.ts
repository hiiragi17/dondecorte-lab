import { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";
import { upsertContentWithCasts } from "./casts";

type ContentMeta = {
  /** ユーザー向けメッセージで使う表示名（例: 動画） */
  label: string;
  /** delete 対象のテーブル名 */
  table: "videos" | "lives" | "radios" | "articles" | "tv_shows" | "topics";
};

const CONTENT_META: Record<ContentType, ContentMeta> = {
  video: { label: "動画", table: "videos" },
  live: { label: "ライブ", table: "lives" },
  radio: { label: "ラジオ", table: "radios" },
  article: { label: "記事", table: "articles" },
  tv_show: { label: "TV番組", table: "tv_shows" },
  topic: { label: "トピック", table: "topics" },
};

export type SaveContentResult = { error?: string };

async function requireUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user != null;
}

/**
 * コンテンツ本体と casts を 1 トランザクションで保存する。
 * 認証チェック・トランザクション・エラーメッセージ整形をまとめて担い、
 * action 側は FormData の解析と revalidate/redirect のみを担当する。
 *
 * contentId が null なら新規登録、指定ありなら更新。
 */
export async function saveContentWithCasts(params: {
  contentType: ContentType;
  contentId: string | null;
  values: Record<string, unknown>;
  casts: CastEntry[];
}): Promise<SaveContentResult> {
  const { label } = CONTENT_META[params.contentType];
  const supabase = await createClient();

  if (!(await requireUser(supabase))) {
    return { error: "認証が必要です" };
  }

  const result = await upsertContentWithCasts(supabase, {
    contentType: params.contentType,
    contentId: params.contentId,
    content: params.values,
    casts: params.casts,
  });

  if (result.error) {
    if (result.notFound) {
      return { error: `指定された${label}が見つかりません` };
    }
    const verb = params.contentId ? "更新" : "登録";
    return { error: `${label}の${verb}に失敗しました: ${result.error}` };
  }

  return {};
}

/**
 * コンテンツ本体を削除する。削除件数を検証し、対象が存在しなければ例外を投げる。
 * エラー時はいずれも例外を投げ、action 側は薄く委譲する。
 */
export async function deleteContent(params: {
  contentType: ContentType;
  id: string;
}): Promise<void> {
  const { label, table } = CONTENT_META[params.contentType];
  const supabase = await createClient();

  if (!(await requireUser(supabase))) {
    throw new Error("認証が必要です");
  }

  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq("id", params.id);

  if (error) {
    throw new Error(`${label}の削除に失敗しました: ${error.message}`);
  }
  if (count !== 1) {
    throw new Error(`指定された${label}が見つかりません`);
  }
}
