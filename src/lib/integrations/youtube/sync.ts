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

  // upsert + ignoreDuplicates で「未登録のみ挿入」をアトミックに行う。
  // SELECT→INSERT 方式だと並行実行時に unique 制約違反でバッチ全体が失敗しうる
  const { data: insertedRows, error } = await adminClient
    .from("videos")
    .upsert(videos.map(toVideoRow), {
      onConflict: "youtube_video_id",
      ignoreDuplicates: true,
    })
    .select("youtube_video_id");

  if (error) {
    throw new Error(`動画の保存に失敗しました: ${error.message}`);
  }

  const insertedVideoIds = (insertedRows ?? [])
    .map((row) => row.youtube_video_id)
    .filter((id): id is string => Boolean(id));

  return {
    fetched: videos.length,
    inserted: insertedVideoIds.length,
    skipped: videos.length - insertedVideoIds.length,
    insertedVideoIds,
  };
}
