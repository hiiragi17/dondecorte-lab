import { describe, expect, it, vi, beforeEach } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

import { getCoAppearanceRanking } from "./co-appearances";

const DONDECORTE_ID = "dd-id";

type AnyRow = Record<string, unknown>;

function buildQueryStub(responses: {
  ownContents: Array<{ content_type: string; content_id: string }>;
  coCasts: AnyRow[];
  dondecorteId?: string | null;
}) {
  supabaseMock.from.mockImplementation((table: string) => {
    if (table === "comedy_groups") {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({
                data:
                  responses.dondecorteId === null
                    ? []
                    : [{ id: responses.dondecorteId ?? DONDECORTE_ID }],
                error: null,
              }),
            }),
          }),
        }),
      };
    }

    if (table === "casts") {
      return {
        select: (cols: string) => {
          // 出演者埋め込みの有無で 2 種類のクエリを判別する
          if (cols.includes("artist:artists")) {
            return {
              in: async () => ({ data: responses.coCasts, error: null }),
            };
          }
          return {
            eq: async () => ({ data: responses.ownContents, error: null }),
          };
        },
      };
    }

    throw new Error(`unexpected table: ${table}`);
  });
}

function comboRow(
  contentType: string,
  contentId: string,
  id: string,
  name: string
): AnyRow {
  return {
    content_type: contentType,
    content_id: contentId,
    artist_id: null,
    comedy_group_id: id,
    unit_id: null,
    artist: null,
    comedy_group: { id, name },
    unit: null,
  };
}

function artistRow(
  contentType: string,
  contentId: string,
  id: string,
  name: string
): AnyRow {
  return {
    content_type: contentType,
    content_id: contentId,
    artist_id: id,
    comedy_group_id: null,
    unit_id: null,
    artist: { id, name },
    comedy_group: null,
    unit: null,
  };
}

function unitRow(
  contentType: string,
  contentId: string,
  id: string,
  name: string
): AnyRow {
  return {
    content_type: contentType,
    content_id: contentId,
    artist_id: null,
    comedy_group_id: null,
    unit_id: id,
    artist: null,
    comedy_group: null,
    unit: { id, name },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCoAppearanceRanking", () => {
  it("ドンデコルテが見つからない場合は found=false を返す", async () => {
    buildQueryStub({
      ownContents: [],
      coCasts: [],
      dondecorteId: null,
    });

    const result = await getCoAppearanceRanking();
    expect(result.found).toBe(false);
    expect(result.combos).toEqual([]);
    expect(result.artists).toEqual([]);
    expect(result.units).toEqual([]);
  });

  it("コンビ・芸人・ユニットそれぞれを共演回数でランキングする", async () => {
    buildQueryStub({
      ownContents: [
        { content_type: "video", content_id: "v1" },
        { content_type: "video", content_id: "v2" },
        { content_type: "live", content_id: "l1" },
      ],
      coCasts: [
        comboRow("video", "v1", DONDECORTE_ID, "ドンデコルテ"),
        comboRow("video", "v1", "combo-a", "コンビA"),
        comboRow("video", "v2", "combo-a", "コンビA"),
        artistRow("video", "v2", "artist-x", "芸人X"),
        comboRow("live", "l1", "combo-b", "コンビB"),
        unitRow("live", "l1", "unit-1", "ユニット1"),
        // content_id "v1" は video のドンデコルテ出演コンテンツだが、
        // content_type が "live" のため別コンテンツ。集計対象外になること。
        comboRow("live", "v1", "combo-c", "コンビC"),
      ],
    });

    const result = await getCoAppearanceRanking();

    expect(result.found).toBe(true);
    expect(result.totalContentCount).toBe(3);

    // (live, v1) は (video, v1) と content_id が衝突するが別コンテンツ
    expect(
      result.combos.find((c) => c.performer.id === "combo-c")
    ).toBeUndefined();

    expect(result.combos).toHaveLength(2);
    expect(result.combos[0]).toMatchObject({
      performer: { type: "comedy_group", id: "combo-a", name: "コンビA" },
      count: 2,
    });
    expect(result.combos[0].breakdown.video).toBe(2);
    expect(result.combos[1]).toMatchObject({
      performer: { type: "comedy_group", id: "combo-b", name: "コンビB" },
      count: 1,
    });
    expect(result.combos[1].breakdown.live).toBe(1);

    expect(result.artists).toEqual([
      {
        performer: { type: "artist", id: "artist-x", name: "芸人X" },
        count: 1,
        breakdown: {
          video: 1,
          live: 0,
          radio: 0,
          article: 0,
          tv_show: 0,
          topic: 0,
        },
      },
    ]);

    expect(result.units).toHaveLength(1);
    expect(result.units[0].performer.name).toBe("ユニット1");
    expect(result.units[0].breakdown.live).toBe(1);
  });

  it("ドンデコルテ自身は集計対象から除外する", async () => {
    buildQueryStub({
      ownContents: [{ content_type: "video", content_id: "v1" }],
      coCasts: [comboRow("video", "v1", DONDECORTE_ID, "ドンデコルテ")],
    });

    const result = await getCoAppearanceRanking();
    expect(result.combos).toEqual([]);
    expect(result.artists).toEqual([]);
    expect(result.units).toEqual([]);
  });
});
