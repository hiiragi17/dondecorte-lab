import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchChannelVideos, fetchUploadsPlaylistId } from "./client";

const originalFetch = global.fetch;

function mockResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("fetchUploadsPlaylistId", () => {
  it("YOUTUBE_API_KEY が未設定なら例外を投げる", async () => {
    delete process.env.YOUTUBE_API_KEY;
    await expect(fetchUploadsPlaylistId("UC_abc")).rejects.toThrow(
      "YOUTUBE_API_KEY"
    );
  });

  it("アップロード再生リストIDを返す", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        items: [
          { contentDetails: { relatedPlaylists: { uploads: "UU_abc" } } },
        ],
      })
    );
    await expect(fetchUploadsPlaylistId("UC_abc")).resolves.toBe("UU_abc");
  });

  it("チャンネルが見つからない場合は例外を投げる", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({ items: [] }));
    await expect(fetchUploadsPlaylistId("UC_missing")).rejects.toThrow(
      "チャンネルが見つかりません"
    );
  });

  it("API がエラーレスポンスを返したら例外を投げる", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ error: "forbidden" }, false, 403));
    await expect(fetchUploadsPlaylistId("UC_abc")).rejects.toThrow(
      /YouTube API.*403/
    );
  });

  it("リクエストがタイムアウトしたら専用エラーを投げる", async () => {
    global.fetch = vi.fn().mockRejectedValue(
      Object.assign(new Error("This operation was aborted"), {
        name: "AbortError",
      })
    );
    await expect(fetchUploadsPlaylistId("UC_abc")).rejects.toThrow(
      "タイムアウト"
    );
  });
});

describe("fetchChannelVideos", () => {
  it("複数ページを辿って動画を取得・マッピングする", async () => {
    global.fetch = vi.fn().mockImplementation((input: URL) => {
      const url = input.toString();
      if (url.includes("/channels")) {
        return Promise.resolve(
          mockResponse({
            items: [
              {
                contentDetails: { relatedPlaylists: { uploads: "UU_abc" } },
              },
            ],
          })
        );
      }
      if (url.includes("pageToken=PAGE2")) {
        return Promise.resolve(
          mockResponse({
            items: [
              {
                contentDetails: {
                  videoId: "vid2",
                  videoPublishedAt: "2026-01-02T00:00:00Z",
                },
                snippet: {
                  title: "動画2",
                  thumbnails: { high: { url: "https://img/high2" } },
                },
              },
            ],
          })
        );
      }
      return Promise.resolve(
        mockResponse({
          nextPageToken: "PAGE2",
          items: [
            {
              contentDetails: {
                videoId: "vid1",
                videoPublishedAt: "2026-01-01T00:00:00Z",
              },
              snippet: {
                title: "  動画1  ",
                description: "  説明  ",
                thumbnails: {
                  medium: { url: "https://img/med1" },
                  maxres: { url: "https://img/maxres1" },
                },
              },
            },
            // videoId を欠く項目はスキップされる
            { snippet: { title: "壊れた項目" } },
          ],
        })
      );
    });

    const result = await fetchChannelVideos("UC_abc");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      youtubeVideoId: "vid1",
      title: "動画1",
      description: "説明",
      publishedAt: "2026-01-01T00:00:00Z",
      thumbnailUrl: "https://img/maxres1",
      channelId: "UC_abc",
    });
    expect(result[1]).toEqual({
      youtubeVideoId: "vid2",
      title: "動画2",
      description: null,
      publishedAt: "2026-01-02T00:00:00Z",
      thumbnailUrl: "https://img/high2",
      channelId: "UC_abc",
    });
  });

  it("maxPages を指定すると、その枚数でページ巡回を打ち切る", async () => {
    const fetchMock = vi.fn().mockImplementation((input: URL) => {
      const url = input.toString();
      if (url.includes("/channels")) {
        return Promise.resolve(
          mockResponse({
            items: [
              {
                contentDetails: { relatedPlaylists: { uploads: "UU_abc" } },
              },
            ],
          })
        );
      }
      // 常に nextPageToken を返し続ける
      return Promise.resolve(
        mockResponse({
          nextPageToken: "NEXT",
          items: [
            {
              contentDetails: { videoId: "vid", videoPublishedAt: null },
              snippet: { title: "動画" },
            },
          ],
        })
      );
    });
    global.fetch = fetchMock;

    await fetchChannelVideos("UC_abc", { maxPages: 2 });

    // channels 1回 + playlistItems 2回
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("maxPages 未指定なら nextPageToken が尽きるまで全ページ取得する", async () => {
    let playlistCalls = 0;
    const fetchMock = vi.fn().mockImplementation((input: URL) => {
      const url = input.toString();
      if (url.includes("/channels")) {
        return Promise.resolve(
          mockResponse({
            items: [
              {
                contentDetails: { relatedPlaylists: { uploads: "UU_abc" } },
              },
            ],
          })
        );
      }
      playlistCalls += 1;
      return Promise.resolve(
        mockResponse({
          // 3ページ目で nextPageToken を返さない
          nextPageToken: playlistCalls < 3 ? `PAGE${playlistCalls}` : undefined,
          items: [
            {
              contentDetails: {
                videoId: `vid${playlistCalls}`,
                videoPublishedAt: null,
              },
              snippet: { title: `動画${playlistCalls}` },
            },
          ],
        })
      );
    });
    global.fetch = fetchMock;

    const result = await fetchChannelVideos("UC_abc");

    expect(result).toHaveLength(3);
    expect(playlistCalls).toBe(3);
  });

  it("maxPages が 0 ならリクエストせず空配列を返す", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    await expect(
      fetchChannelVideos("UC_abc", { maxPages: 0 })
    ).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
