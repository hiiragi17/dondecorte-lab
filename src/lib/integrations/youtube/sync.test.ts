import { describe, it, expect, vi, beforeEach } from "vitest";
import type { YoutubeVideo } from "./types";

const adminClientMock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: adminClientMock }));

const fetchChannelVideosMock = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ fetchChannelVideos: fetchChannelVideosMock }));

import { syncChannelVideos, syncAllChannels } from "./sync";

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

// upsert(...).select(...) のチェーンをモックする。
// inserted には「実際に挿入された行（重複は除外済み）」を渡す
function setupAdmin(
  options: {
    inserted?: Array<{ youtube_video_id: string | null }>;
    upsertError?: { message: string } | null;
  } = {}
) {
  const selectMock = vi.fn().mockResolvedValue({
    data: options.inserted ?? [],
    error: options.upsertError ?? null,
  });
  const upsertMock = vi.fn(() => ({ select: selectMock }));
  adminClientMock.from.mockReturnValue({ upsert: upsertMock });
  return { upsertMock, selectMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncChannelVideos", () => {
  it("動画が0件なら何も保存しない", async () => {
    fetchChannelVideosMock.mockResolvedValue([]);
    const { upsertMock } = setupAdmin();

    const result = await syncChannelVideos("UC_abc");

    expect(result).toEqual({
      fetched: 0,
      inserted: 0,
      skipped: 0,
      insertedVideoIds: [],
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("upsert に全件を渡し、挿入された分のみを inserted として集計する", async () => {
    fetchChannelVideosMock.mockResolvedValue([
      buildVideo("a"),
      buildVideo("b"),
      buildVideo("c"),
    ]);
    // b は既存のため upsert で挿入されず、a/c のみ返る
    const { upsertMock } = setupAdmin({
      inserted: [{ youtube_video_id: "a" }, { youtube_video_id: "c" }],
    });

    const result = await syncChannelVideos("UC_abc");

    expect(result).toEqual({
      fetched: 3,
      inserted: 2,
      skipped: 1,
      insertedVideoIds: ["a", "c"],
    });
    expect(upsertMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          youtube_video_id: "a",
          youtube_url: "https://www.youtube.com/watch?v=a",
          youtube_channel_id: "UC_abc",
        }),
        expect.objectContaining({ youtube_video_id: "b" }),
        expect.objectContaining({ youtube_video_id: "c" }),
      ],
      { onConflict: "youtube_video_id", ignoreDuplicates: true }
    );
  });

  it("取得結果内の重複を除外してから upsert する", async () => {
    fetchChannelVideosMock.mockResolvedValue([
      buildVideo("a"),
      buildVideo("a"),
      buildVideo("b"),
    ]);
    const { upsertMock } = setupAdmin({
      inserted: [{ youtube_video_id: "a" }, { youtube_video_id: "b" }],
    });

    const result = await syncChannelVideos("UC_abc");

    expect(result.fetched).toBe(2);
    expect(result.inserted).toBe(2);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({ youtube_video_id: "a" }),
        expect.objectContaining({ youtube_video_id: "b" }),
      ],
      { onConflict: "youtube_video_id", ignoreDuplicates: true }
    );
  });

  it("全て登録済みなら inserted=0 を返す", async () => {
    fetchChannelVideosMock.mockResolvedValue([buildVideo("a")]);
    const { upsertMock } = setupAdmin({ inserted: [] });

    const result = await syncChannelVideos("UC_abc");

    expect(result).toEqual({
      fetched: 1,
      inserted: 0,
      skipped: 1,
      insertedVideoIds: [],
    });
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  it("保存に失敗したら例外を投げる", async () => {
    fetchChannelVideosMock.mockResolvedValue([buildVideo("a")]);
    setupAdmin({ upsertError: { message: "upsert boom" } });

    await expect(syncChannelVideos("UC_abc")).rejects.toThrow(
      "動画の保存に失敗しました: upsert boom"
    );
  });
});

// comedy_groups の select / videos の upsert を table 名で分岐してモックする
function setupAllChannels(options: {
  channelRows?: Array<{ youtube_channel_id: string | null }>;
  channelsError?: { message: string } | null;
}) {
  const notMock = vi.fn().mockResolvedValue({
    data: options.channelRows ?? [],
    error: options.channelsError ?? null,
  });
  const selectMock = vi.fn(() => ({ not: notMock }));

  const videoSelectMock = vi
    .fn()
    .mockResolvedValue({ data: [{ youtube_video_id: "x" }], error: null });
  const upsertMock = vi.fn(() => ({ select: videoSelectMock }));

  adminClientMock.from.mockImplementation((table: string) => {
    if (table === "comedy_groups") return { select: selectMock };
    return { upsert: upsertMock };
  });

  return { selectMock, notMock, upsertMock };
}

describe("syncAllChannels", () => {
  it("登録チャンネルが無ければ何もしない", async () => {
    setupAllChannels({ channelRows: [] });

    const result = await syncAllChannels();

    expect(result).toEqual({ channels: 0, inserted: 0, outcomes: [] });
    expect(fetchChannelVideosMock).not.toHaveBeenCalled();
  });

  it("重複・null を除外して各チャンネルを同期する", async () => {
    setupAllChannels({
      channelRows: [
        { youtube_channel_id: "UC_a" },
        { youtube_channel_id: "UC_a" },
        { youtube_channel_id: null },
        { youtube_channel_id: "UC_b" },
      ],
    });
    fetchChannelVideosMock.mockResolvedValue([buildVideo("x")]);

    const result = await syncAllChannels();

    expect(result.channels).toBe(2);
    expect(result.inserted).toBe(2);
    expect(result.outcomes.map((o) => o.channelId)).toEqual(["UC_a", "UC_b"]);
    expect(result.outcomes.every((o) => o.ok)).toBe(true);
    expect(fetchChannelVideosMock).toHaveBeenCalledTimes(2);
  });

  it("1チャンネルが失敗しても他チャンネルは継続する", async () => {
    setupAllChannels({
      channelRows: [
        { youtube_channel_id: "UC_a" },
        { youtube_channel_id: "UC_b" },
      ],
    });
    fetchChannelVideosMock
      .mockRejectedValueOnce(new Error("UC_a fail"))
      .mockResolvedValueOnce([buildVideo("x")]);

    const result = await syncAllChannels();

    expect(result.channels).toBe(2);
    expect(result.inserted).toBe(1);
    expect(result.outcomes[0]).toMatchObject({
      channelId: "UC_a",
      ok: false,
      error: "UC_a fail",
    });
    expect(result.outcomes[1]).toMatchObject({ channelId: "UC_b", ok: true });
  });

  it("チャンネル一覧の取得に失敗したら例外を投げる", async () => {
    setupAllChannels({ channelsError: { message: "select boom" } });

    await expect(syncAllChannels()).rejects.toThrow(
      "チャンネル一覧の取得に失敗しました: select boom"
    );
  });
});
