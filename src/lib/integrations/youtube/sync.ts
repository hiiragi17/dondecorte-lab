import { adminClient } from "@/lib/supabase/admin";
import {
  autoTagVideos,
  loadPerformerCandidates,
  type PerformerCandidateSet,
  type TaggableVideo,
} from "./auto-tag";
import { fetchChannelVideos } from "./client";
import type { YoutubeVideo } from "./types";

export type SyncChannelResult = {
  fetched: number;
  inserted: number;
  skipped: number;
  insertedVideoIds: string[];
  // 自動タグ付けで挿入した video_casts の行数。
  tagged: number;
};

type InsertedVideoRow = {
  id: string;
  youtube_video_id: string | null;
  title: string | null;
  description: string | null;
};

// 新規挿入された動画に出演者を自動タグ付けする（ベストエフォート）。
// タグ付けの失敗で動画取得自体を無駄にしないよう、例外は握りつぶして 0 を返す。
// candidateSet が渡されればそれを使い回し、未指定なら都度読み込む（単体呼び出し用）。
async function tagInsertedVideos(
  channelId: string,
  insertedRows: InsertedVideoRow[],
  candidateSet?: PerformerCandidateSet
): Promise<number> {
  const videos: TaggableVideo[] = insertedRows
    .filter((row): row is InsertedVideoRow & { title: string } =>
      Boolean(row.id && row.title)
    )
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
    }));

  if (videos.length === 0) return 0;

  try {
    const { candidates, groupIdByChannelId } =
      candidateSet ?? (await loadPerformerCandidates(adminClient));
    const ownerGroupId = groupIdByChannelId.get(channelId) ?? null;
    return await autoTagVideos(adminClient, {
      videos,
      candidates,
      ownerGroupId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[youtube] 自動タグ付けに失敗しました: ${message}`);
    return 0;
  }
}

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

// チャンネルの動画一覧を取得し、youtube_video_id で未登録のものだけ videos に保存する。
// candidateSet を渡すと自動タグ付けの候補読み込みを省略できる（複数チャンネル同期での使い回し用）。
export async function syncChannelVideos(
  channelId: string,
  candidateSet?: PerformerCandidateSet
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
    return { fetched: 0, inserted: 0, skipped: 0, insertedVideoIds: [], tagged: 0 };
  }

  // upsert + ignoreDuplicates で「未登録のみ挿入」をアトミックに行う。
  // SELECT→INSERT 方式だと並行実行時に unique 制約違反でバッチ全体が失敗しうる
  const { data: insertedRows, error } = await adminClient
    .from("videos")
    .upsert(videos.map(toVideoRow), {
      onConflict: "youtube_video_id",
      ignoreDuplicates: true,
    })
    .select("id, youtube_video_id, title, description");

  if (error) {
    throw new Error(`動画の保存に失敗しました: ${error.message}`);
  }

  const rows = (insertedRows ?? []) as InsertedVideoRow[];
  const insertedVideoIds = rows
    .map((row) => row.youtube_video_id)
    .filter((id): id is string => Boolean(id));

  const tagged = await tagInsertedVideos(channelId, rows, candidateSet);

  return {
    fetched: videos.length,
    inserted: insertedVideoIds.length,
    skipped: videos.length - insertedVideoIds.length,
    insertedVideoIds,
    tagged,
  };
}

export type ChannelSyncOutcome = {
  channelId: string;
} & ({ ok: true; result: SyncChannelResult } | { ok: false; error: string });

export type SyncAllChannelsResult = {
  channels: number;
  inserted: number;
  tagged: number;
  outcomes: ChannelSyncOutcome[];
};

// comedy_groups に登録された youtube_channel_id を全件取得する（重複・null は除外）。
async function listSyncableChannelIds(): Promise<string[]> {
  const { data, error } = await adminClient
    .from("comedy_groups")
    .select("youtube_channel_id")
    .not("youtube_channel_id", "is", null);

  if (error) {
    throw new Error(`チャンネル一覧の取得に失敗しました: ${error.message}`);
  }

  const ids = (data ?? [])
    .map((row) => row.youtube_channel_id)
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return [...new Set(ids)];
}

// 登録済みチャンネルを巡回して同期する。
// 1 チャンネルの失敗で全体を止めないよう、チャンネル単位でエラーを隔離する。
export async function syncAllChannels(): Promise<SyncAllChannelsResult> {
  const channelIds = await listSyncableChannelIds();

  // 出演者候補は同期実行中に変化しないため、1回だけ読み込んで全チャンネルで使い回す
  // （チャンネル毎の再読み込みによる N+1 を避ける）。読み込み失敗時は各チャンネルの
  // 遅延読み込みにフォールバックさせるため undefined のままにする。
  let candidateSet: PerformerCandidateSet | undefined;
  if (channelIds.length > 0) {
    try {
      candidateSet = await loadPerformerCandidates(adminClient);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[youtube] 出演者候補の読み込みに失敗しました: ${message}`);
    }
  }

  const outcomes: ChannelSyncOutcome[] = [];
  let inserted = 0;
  let tagged = 0;

  for (const channelId of channelIds) {
    try {
      const result = await syncChannelVideos(channelId, candidateSet);
      inserted += result.inserted;
      tagged += result.tagged;
      outcomes.push({ channelId, ok: true, result });
    } catch (error) {
      outcomes.push({
        channelId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { channels: channelIds.length, inserted, tagged, outcomes };
}
