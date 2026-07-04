import { describe, it, expect, vi, beforeEach } from "vitest";
import { autoTagVideos, loadPerformerCandidates } from "./auto-tag";
import type { PerformerCandidate } from "./performer-matcher";

// adminClient を模したチェーンモック。table 名で from の戻りを分岐する。
type QueryResult = { data: unknown; error: { message: string } | null };

function makeClient(handlers: {
  select?: Record<string, QueryResult>;
  insert?: QueryResult;
}) {
  const insertMock = vi.fn().mockResolvedValue(handlers.insert ?? { error: null });
  const from = vi.fn((table: string) => {
    if (table === "video_casts") {
      return { insert: insertMock };
    }
    return {
      select: vi.fn().mockResolvedValue(
        handlers.select?.[table] ?? { data: [], error: null }
      ),
    };
  });
  return { client: { from } as never, from, insertMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadPerformerCandidates", () => {
  it("artists/comedy_groups/units を候補化し、チャンネル→コンビの対応表も作る", async () => {
    const { client } = makeClient({
      select: {
        artists: {
          data: [{ id: "a1", name: "渡辺銀次", kana_name: "わたなべぎんじ" }],
          error: null,
        },
        comedy_groups: {
          data: [
            {
              id: "g1",
              name: "ドンデコルテ",
              kana_name: "どんでこるて",
              youtube_channel_id: "UC_don",
            },
          ],
          error: null,
        },
        units: {
          data: [{ id: "u1", name: "ダウ90000" }],
          error: null,
        },
      },
    });

    const { candidates, groupIdByChannelId } =
      await loadPerformerCandidates(client);

    expect(candidates).toEqual([
      {
        type: "comedy_group",
        id: "g1",
        name: "ドンデコルテ",
        aliases: ["どんでこるて"],
      },
      { type: "artist", id: "a1", name: "渡辺銀次", aliases: ["わたなべぎんじ"] },
      { type: "unit", id: "u1", name: "ダウ90000" },
    ]);
    expect(groupIdByChannelId.get("UC_don")).toBe("g1");
  });

  it("取得エラーは例外として投げる", async () => {
    const { client } = makeClient({
      select: {
        artists: { data: null, error: { message: "boom" } },
      },
    });

    await expect(loadPerformerCandidates(client)).rejects.toThrow(
      "芸人候補の取得に失敗しました: boom"
    );
  });
});

describe("autoTagVideos", () => {
  const candidates: PerformerCandidate[] = [
    { type: "artist", id: "a1", name: "渡辺銀次" },
    { type: "artist", id: "a2", name: "小橋共作" },
  ];

  it("タイトル一致とチャンネル所有コンビを video_casts に挿入する", async () => {
    const { client, insertMock } = makeClient({});

    const count = await autoTagVideos(client, {
      videos: [
        { id: "v1", title: "渡辺銀次のソロ回", description: null },
      ],
      candidates,
      ownerGroupId: "g1",
    });

    expect(count).toBe(2);
    expect(insertMock).toHaveBeenCalledWith([
      {
        video_id: "v1",
        artist_id: null,
        comedy_group_id: "g1",
        unit_id: null,
      },
      {
        video_id: "v1",
        artist_id: "a1",
        comedy_group_id: null,
        unit_id: null,
      },
    ]);
  });

  it("該当出演者がなくても所有コンビだけはタグ付けする", async () => {
    const { client, insertMock } = makeClient({});

    const count = await autoTagVideos(client, {
      videos: [{ id: "v1", title: "ゲスト無し雑談", description: null }],
      candidates,
      ownerGroupId: "g1",
    });

    expect(count).toBe(1);
    expect(insertMock).toHaveBeenCalledWith([
      {
        video_id: "v1",
        artist_id: null,
        comedy_group_id: "g1",
        unit_id: null,
      },
    ]);
  });

  it("所有コンビが本文にも一致する場合は重複させない", async () => {
    const { client } = makeClient({});
    const withGroup: PerformerCandidate[] = [
      { type: "comedy_group", id: "g1", name: "ドンデコルテ" },
    ];

    const count = await autoTagVideos(client, {
      videos: [{ id: "v1", title: "ドンデコルテ新作", description: null }],
      candidates: withGroup,
      ownerGroupId: "g1",
    });

    expect(count).toBe(1);
  });

  it("挿入対象が無ければ insert を呼ばず 0 を返す", async () => {
    const { client, insertMock } = makeClient({});

    const count = await autoTagVideos(client, {
      videos: [{ id: "v1", title: "該当なし", description: null }],
      candidates,
    });

    expect(count).toBe(0);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("動画0件なら何もしない", async () => {
    const { client, insertMock } = makeClient({});

    const count = await autoTagVideos(client, { videos: [], candidates });

    expect(count).toBe(0);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("挿入エラーは例外として投げる", async () => {
    const { client } = makeClient({
      insert: { data: null, error: { message: "insert boom" } },
    });

    await expect(
      autoTagVideos(client, {
        videos: [{ id: "v1", title: "渡辺銀次", description: null }],
        candidates,
      })
    ).rejects.toThrow("出演者の自動タグ付けに失敗しました: insert boom");
  });

  it("description も照合対象に含める", async () => {
    const { client, insertMock } = makeClient({});

    const count = await autoTagVideos(client, {
      videos: [
        { id: "v1", title: "コント", description: "出演: 小橋共作" },
      ],
      candidates,
    });

    expect(count).toBe(1);
    expect(insertMock).toHaveBeenCalledWith([
      {
        video_id: "v1",
        artist_id: "a2",
        comedy_group_id: null,
        unit_id: null,
      },
    ]);
  });
});
