import { createClient } from "@/lib/supabase/server";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
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
    allowedIds = await getIdsForPerformer(
      supabase,
      "video_casts",
      "video_id",
      options.performer
    );
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
    .select(
      `*,
       video_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`動画情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const casts = mapCasts(
    (data as Record<string, unknown>).video_casts as CastRow[] | null | undefined
  );

  const videoBase: Video = {
    id: (data as { id: string }).id,
    title: (data as { title: string }).title,
    youtube_url: (data as { youtube_url: string | null }).youtube_url,
    youtube_video_id: (data as { youtube_video_id: string | null }).youtube_video_id,
    youtube_channel_id: (data as { youtube_channel_id: string | null }).youtube_channel_id,
    thumbnail_url: (data as { thumbnail_url: string | null }).thumbnail_url,
    published_at: (data as { published_at: string | null }).published_at,
    description: (data as { description: string | null }).description,
    created_at: (data as { created_at: string }).created_at,
    updated_at: (data as { updated_at: string }).updated_at,
  };

  return { ...videoBase, casts };
}
