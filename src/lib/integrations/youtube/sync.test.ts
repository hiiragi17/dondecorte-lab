import { describe, it, expect, vi, beforeEach } from "vitest";
import type { YoutubeVideo } from "./types";

const adminClientMock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: adminClientMock }));

const fetchChannelVideosMock = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ fetchChannelVideos: fetchChannelVideosMock }));

import { syncChannelVideos } from "./sync";

function buildVideo(id: string): YoutubeVideo {
  return {
    youtubeVideoId: id,
    title: `動画-${id}`,
    description: null,
    publishedAt: "2026-01-01T00:00:00Z",
    thumbnailUrl: null,
    channelId: "UC_abc",
  };
}

function setupAdmin(
  options: {
    existing?: Array<{ youtube_video_id: string | null }>;
    selectError?: { message: string } | null;
    insertError?: { message: string } | null;
  } = {}
) {
  const inMock = vi.fn().mockResolvedValue({
    data: options.existing ?? [],
    error: options.selectError ?? null,
  });
  const selectMock = vi.fn(() => ({ in: inMock }));
  const insertMock = vi
    .fn()
    .mockResolvedValue({ error: options.insertError ?? null });
  adminClientMock.from.mockReturnValue({
    select: selectMock,
    insert: insertMock,
  });
  return { inMock, selectMock, insertMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncChannelVideos", () => {
  it("動画が0件なら何も保存しない", async () => {
    fetchChannelVideosMock.mockResolvedValue([]);
    const { selectMock, insertMock } = setupAdmin();

    const result = await syncChannelVideos("UC_abc");

    expect(result).toEqual({
      fetched: 0,
      inserted: 0,
      skipped: 0,
      insertedVideoIds: [],
    });
    expect(selectMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("未登録の動画だけを保存する", async () => {
    fetchChannelVideosMock.mockResolvedValue([
      buildVideo("a"),
      buildVideo("b"),
      buildVideo("c"),
    ]);
    const { insertMock } = setupAdmin({
      existing: [{ youtube_video_id: "b" }],
    });

    const result = await syncChannelVideos("UC_abc");

    expect(result).toEqual({
      fetched: 3,
      inserted: 2,
      skipped: 1,
      insertedVideoIds: ["a", "c"],
    });
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        youtube_video_id: "a",
        youtube_url: "https://www.youtube.com/watch?v=a",
        youtube_channel_id: "UC_abc",
      }),
      expect.objectContaining({ youtube_video_id: "c" }),
    ]);
  });

  it("取得結果内の重複を除外する", async () => {
    fetchChannelVideosMock.mockResolvedValue([
      buildVideo("a"),
      buildVideo("a"),
      buildVideo("b"),
    ]);
    const { insertMock } = setupAdmin();

    const result = await syncChannelVideos("UC_abc");

    expect(result.fetched).toBe(2);
    expect(result.inserted).toBe(2);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it("全て登録済みなら insert を呼ばない", async () => {
    fetchChannelVideosMock.mockResolvedValue([buildVideo("a")]);
    const { insertMock } = setupAdmin({
      existing: [{ youtube_video_id: "a" }],
    });

    const result = await syncChannelVideos("UC_abc");

    expect(result).toEqual({
      fetched: 1,
      inserted: 0,
      skipped: 1,
      insertedVideoIds: [],
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("既存動画の確認に失敗したら例外を投げる", async () => {
    fetchChannelVideosMock.mockResolvedValue([buildVideo("a")]);
    setupAdmin({ selectError: { message: "select boom" } });

    await expect(syncChannelVideos("UC_abc")).rejects.toThrow(
      "既存動画の確認に失敗しました: select boom"
    );
  });

  it("保存に失敗したら例外を投げる", async () => {
    fetchChannelVideosMock.mockResolvedValue([buildVideo("a")]);
    setupAdmin({ insertError: { message: "insert boom" } });

    await expect(syncChannelVideos("UC_abc")).rejects.toThrow(
      "動画の保存に失敗しました: insert boom"
    );
  });
});
