import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
import type { Video, VideoWithCasts } from "@/lib/types/video";

export async function listVideos(options: ListOptions = {}): Promise<Video[]> {
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

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`動画一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Video[];
}

export async function getVideo(id: string): Promise<VideoWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`動画情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "video", [id]);

  return { ...(data as Video), casts: castsByContent.get(id) ?? [] };
}
