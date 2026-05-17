import type { YoutubeVideo } from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_RESULTS_PER_PAGE = 50;
const REQUEST_TIMEOUT_MS = 10_000;

// 画質の高い順。利用可能な最初のものを採用する
const THUMBNAIL_PRIORITY = ["maxres", "standard", "high", "medium", "default"];

type Thumbnails = Record<string, { url?: string } | undefined>;

type ChannelsResponse = {
  items?: Array<{
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
};

type PlaylistItemsResponse = {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: Thumbnails;
      resourceId?: { videoId?: string };
    };
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
  }>;
};

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY が設定されていません");
  }
  return key;
}

function pickThumbnailUrl(thumbnails: Thumbnails | undefined): string | null {
  if (!thumbnails) return null;
  for (const key of THUMBNAIL_PRIORITY) {
    const url = thumbnails[key]?.url;
    if (url) return url;
  }
  return null;
}

async function youtubeRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set("key", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // 外部APIのハングでsyncが固まらないようタイムアウトを設ける
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `YouTube API リクエストがタイムアウトしました (${REQUEST_TIMEOUT_MS}ms)`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `YouTube API リクエストに失敗しました (${response.status}): ${body}`
    );
  }

  return response.json() as Promise<T>;
}

// チャンネルのアップロード再生リストID（search.list より低コストで全動画を辿れる）
export async function fetchUploadsPlaylistId(
  channelId: string
): Promise<string> {
  const data = await youtubeRequest<ChannelsResponse>("channels", {
    part: "contentDetails",
    id: channelId,
  });
  const uploads =
    data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    throw new Error(`チャンネルが見つかりません: ${channelId}`);
  }
  return uploads;
}

export async function fetchChannelVideos(
  channelId: string,
  options: { maxPages?: number } = {}
): Promise<YoutubeVideo[]> {
  // maxPages 未指定なら全ページ取得（チャンネル全動画の取りこぼしを防ぐ）。
  // 指定時のみページ数を制限し、0以下/不正値なら何も取得しない
  const maxPages = options.maxPages;
  if (maxPages !== undefined && !(maxPages >= 1)) {
    return [];
  }

  const playlistId = await fetchUploadsPlaylistId(channelId);

  const videos: YoutubeVideo[] = [];
  let pageToken: string | undefined;
  let page = 0;

  while (maxPages === undefined || page < maxPages) {
    const params: Record<string, string> = {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: String(MAX_RESULTS_PER_PAGE),
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await youtubeRequest<PlaylistItemsResponse>(
      "playlistItems",
      params
    );

    for (const item of data.items ?? []) {
      const videoId =
        item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title?.trim();
      // videoId / title を欠く項目（削除・非公開動画など）はスキップ
      if (!videoId || !title) continue;

      videos.push({
        youtubeVideoId: videoId,
        title,
        description: item.snippet?.description?.trim() || null,
        publishedAt:
          item.contentDetails?.videoPublishedAt ??
          item.snippet?.publishedAt ??
          null,
        thumbnailUrl: pickThumbnailUrl(item.snippet?.thumbnails),
        channelId,
      });
    }

    page += 1;
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return videos;
}
