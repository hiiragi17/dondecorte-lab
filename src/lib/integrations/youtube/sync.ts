import { adminClient } from "@/lib/supabase/admin";
import { fetchChannelVideos } from "./client";
import type { YoutubeVideo } from "./types";

export type SyncChannelResult = {
  fetched: number;
  inserted: number;
  skipped: number;
  insertedVideoIds: string[];
};

function toVideoRow(video: YoutubeVideo) {
  return {
    title: video.title,
    youtube_video_id: video.youtubeVideoId,
    youtube_url: `https://www.youtube.com/watch?v=${video.youtubeVideoId}`,
    youtube_channel_id: video.channelId,
    thumbnail_url: video.thumbnailUrl,
    published_at: video.publishedAt,
    description: video.description,
  };
}

// チャンネルの動画一覧を取得し、youtube_video_id で未登録のものだけ videos に保存する
export async function syncChannelVideos(
  channelId: string
): Promise<SyncChannelResult> {
  const fetched = await fetchChannelVideos(channelId);

  // 取得結果内の重複を youtube_video_id で除外
  const uniqueByVideoId = new Map<string, YoutubeVideo>();
  for (const video of fetched) {
    if (!uniqueByVideoId.has(video.youtubeVideoId)) {
      uniqueByVideoId.set(video.youtubeVideoId, video);
    }
  }
  const videos = [...uniqueByVideoId.values()];

  if (videos.length === 0) {
    return { fetched: 0, inserted: 0, skipped: 0, insertedVideoIds: [] };
  }

  const { data: existing, error: selectError } = await adminClient
    .from("videos")
    .select("youtube_video_id")
    .in(
      "youtube_video_id",
      videos.map((v) => v.youtubeVideoId)
    );

  if (selectError) {
    throw new Error(`既存動画の確認に失敗しました: ${selectError.message}`);
  }

  const existingIds = new Set(
    (existing ?? [])
      .map((row) => row.youtube_video_id)
      .filter((id): id is string => Boolean(id))
  );

  const newVideos = videos.filter(
    (video) => !existingIds.has(video.youtubeVideoId)
  );

  if (newVideos.length === 0) {
    return {
      fetched: videos.length,
      inserted: 0,
      skipped: videos.length,
      insertedVideoIds: [],
    };
  }

  const { error: insertError } = await adminClient
    .from("videos")
    .insert(newVideos.map(toVideoRow));

  if (insertError) {
    throw new Error(`動画の保存に失敗しました: ${insertError.message}`);
  }

  return {
    fetched: videos.length,
    inserted: newVideos.length,
    skipped: videos.length - newVideos.length,
    insertedVideoIds: newVideos.map((v) => v.youtubeVideoId),
  };
}
