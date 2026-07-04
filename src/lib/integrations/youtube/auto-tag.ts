import type { adminClient } from "@/lib/supabase/admin";
import type { CastEntry } from "@/lib/types";
import { matchPerformers, type PerformerCandidate } from "./performer-matcher";

type AdminClient = typeof adminClient;

export type PerformerCandidateSet = {
  candidates: PerformerCandidate[];
  // youtube_channel_id → comedy_group.id。チャンネル所有コンビを常にタグ付けるため。
  groupIdByChannelId: Map<string, string>;
};

// 自動タグ付けの対象となる動画（videos の一部カラム）。
export type TaggableVideo = {
  id: string;
  title: string;
  description: string | null;
};

// artists / comedy_groups / units を照合候補として読み込む。
// 名前 + かな名（あれば）を別表記として持たせる。
export async function loadPerformerCandidates(
  client: AdminClient
): Promise<PerformerCandidateSet> {
  const [artists, groups, units] = await Promise.all([
    client.from("artists").select("id, name, kana_name"),
    client.from("comedy_groups").select("id, name, kana_name, youtube_channel_id"),
    client.from("units").select("id, name"),
  ]);

  if (artists.error) {
    throw new Error(`芸人候補の取得に失敗しました: ${artists.error.message}`);
  }
  if (groups.error) {
    throw new Error(`コンビ候補の取得に失敗しました: ${groups.error.message}`);
  }
  if (units.error) {
    throw new Error(`ユニット候補の取得に失敗しました: ${units.error.message}`);
  }

  const candidates: PerformerCandidate[] = [];
  const groupIdByChannelId = new Map<string, string>();

  for (const row of groups.data ?? []) {
    candidates.push({
      type: "comedy_group",
      id: row.id,
      name: row.name,
      aliases: [row.kana_name],
    });
    const channelId = row.youtube_channel_id?.trim();
    if (channelId) {
      groupIdByChannelId.set(channelId, row.id);
    }
  }

  for (const row of artists.data ?? []) {
    candidates.push({
      type: "artist",
      id: row.id,
      name: row.name,
      aliases: [row.kana_name],
    });
  }

  for (const row of units.data ?? []) {
    candidates.push({ type: "unit", id: row.id, name: row.name });
  }

  return { candidates, groupIdByChannelId };
}

// CastEntry を casts の1行に変換する。
// casts はポリモーフィック設計（content_type + content_id）で、
// artist/comedy_group/unit のうち1つだけ NOT NULL（migration 005）。
function toCastRow(videoId: string, cast: CastEntry) {
  return {
    content_type: "video" as const,
    content_id: videoId,
    artist_id: cast.type === "artist" ? cast.id : null,
    comedy_group_id: cast.type === "comedy_group" ? cast.id : null,
    unit_id: cast.type === "unit" ? cast.id : null,
  };
}

/**
 * 新規取得動画のタイトル/説明から出演者を推定し、casts に自動挿入する。
 * チャンネル所有コンビ（ownerGroupId）は本文一致に関わらず常にタグ付けする。
 * 対象動画は新規挿入分のみを想定しているため insert のみ。挿入した cast 行数を返す。
 */
export async function autoTagVideos(
  client: AdminClient,
  params: {
    videos: TaggableVideo[];
    candidates: PerformerCandidate[];
    ownerGroupId?: string | null;
  }
): Promise<number> {
  const { videos, candidates, ownerGroupId } = params;
  if (videos.length === 0) return 0;

  const rows: ReturnType<typeof toCastRow>[] = [];

  for (const video of videos) {
    const text = [video.title, video.description]
      .filter((v): v is string => Boolean(v))
      .join(" ");

    const matched = matchPerformers(text, candidates);

    // チャンネル所有コンビを先頭に加える（本文に名前が無くても出演者だから）。
    // 表示名は候補から解決し、プレースホルダ（空文字）が casts に混入しないようにする。
    const casts: CastEntry[] = [...matched];
    if (ownerGroupId && !casts.some((c) => c.type === "comedy_group" && c.id === ownerGroupId)) {
      const ownerName =
        candidates.find(
          (c) => c.type === "comedy_group" && c.id === ownerGroupId
        )?.name ?? "";
      casts.unshift({ type: "comedy_group", id: ownerGroupId, name: ownerName });
    }

    for (const cast of casts) {
      rows.push(toCastRow(video.id, cast));
    }
  }

  if (rows.length === 0) return 0;

  const { error } = await client.from("casts").insert(rows);
  if (error) {
    throw new Error(`出演者の自動タグ付けに失敗しました: ${error.message}`);
  }

  return rows.length;
}
