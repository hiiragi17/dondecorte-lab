import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Video, VideoWithCasts } from "@/lib/types/video";

export type ListVideosOptions = ListOptions & {
  /** 承認済み以外（承認待ち・却下）も含める。管理画面専用 */
  includeUnapproved?: boolean;
};

export async function listVideos(
  options: ListVideosOptions = {}
): Promise<Video[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(supabase, "video", options.performer);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("videos")
    .select("*")
    .order("published_at", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (!options.includeUnapproved) {
    query = query.eq("review_status", "approved");
  }

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`動画一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Video[];
}

export async function getVideo(
  id: string,
  options: { includeUnapproved?: boolean } = {}
): Promise<VideoWithCasts | null> {
  const supabase = await createClient();

  let query = supabase.from("videos").select("*").eq("id", id);
  if (!options.includeUnapproved) {
    query = query.eq("review_status", "approved");
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`動画情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "video", [id]);

  return { ...(data as Video), casts: castsByContent.get(id) ?? [] };
}

/** レビュー対象（承認待ち・却下）の動画を casts 付きで取得する。管理画面専用 */
export async function listVideosForReview(): Promise<{
  pending: VideoWithCasts[];
  rejected: VideoWithCasts[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .neq("review_status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`レビュー対象動画の取得に失敗しました: ${error.message}`);
  }

  const videos = (data ?? []) as Video[];
  if (videos.length === 0) return { pending: [], rejected: [] };

  const castsByContent = await fetchCastsByContent(
    supabase,
    "video",
    videos.map((v) => v.id)
  );
  const withCasts: VideoWithCasts[] = videos.map((v) => ({
    ...v,
    casts: castsByContent.get(v.id) ?? [],
  }));

  return {
    pending: withCasts.filter((v) => v.review_status === "pending"),
    rejected: withCasts.filter((v) => v.review_status === "rejected"),
  };
}
