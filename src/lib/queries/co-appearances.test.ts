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
  ownParents: Record<string, string[]>;
  coCasts: Record<string, AnyRow[]>;
  dondecorteId?: string | null;
}) {
  supabaseMock.from.mockImplementation((table: string) => {
    if (table === "comedy_groups") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data:
                responses.dondecorteId === null
                  ? null
                  : { id: responses.dondecorteId ?? DONDECORTE_ID },
              error: null,
            }),
          }),
        }),
      };
    }

    return {
      select: (cols: string) => {
        if (cols.includes("artist:artists")) {
          return {
            in: async () => ({
              data: responses.coCasts[table] ?? [],
              error: null,
            }),
          };
        }
        return {
          eq: async () => ({
            data: (responses.ownParents[table] ?? []).map((id) => {
              const field = cols.trim();
              return { [field]: id };
            }),
            error: null,
          }),
        };
      },
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCoAppearanceRanking", () => {
  it("ドンデコルテが見つからない場合は found=false を返す", async () => {
    buildQueryStub({
      ownParents: {},
      coCasts: {},
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
      ownParents: {
        video_casts: ["v1", "v2"],
        live_casts: ["l1"],
        radio_casts: [],
        article_casts: [],
        tv_show_casts: [],
        topic_casts: [],
      },
      coCasts: {
        video_casts: [
          {
            video_id: "v1",
            artist_id: null,
            comedy_group_id: DONDECORTE_ID,
            unit_id: null,
            artist: null,
            comedy_group: { id: DONDECORTE_ID, name: "ドンデコルテ" },
            unit: null,
          },
          {
            video_id: "v1",
            artist_id: null,
            comedy_group_id: "combo-a",
            unit_id: null,
            artist: null,
            comedy_group: { id: "combo-a", name: "コンビA" },
            unit: null,
          },
          {
            video_id: "v2",
            artist_id: null,
            comedy_group_id: "combo-a",
            unit_id: null,
            artist: null,
            comedy_group: { id: "combo-a", name: "コンビA" },
            unit: null,
          },
          {
            video_id: "v2",
            artist_id: "artist-x",
            comedy_group_id: null,
            unit_id: null,
            artist: { id: "artist-x", name: "芸人X" },
            comedy_group: null,
            unit: null,
          },
        ],
        live_casts: [
          {
            live_id: "l1",
            artist_id: null,
            comedy_group_id: "combo-b",
            unit_id: null,
            artist: null,
            comedy_group: { id: "combo-b", name: "コンビB" },
            unit: null,
          },
          {
            live_id: "l1",
            artist_id: null,
            comedy_group_id: null,
            unit_id: "unit-1",
            artist: null,
            comedy_group: null,
            unit: { id: "unit-1", name: "ユニット1" },
          },
        ],
      },
    });

    const result = await getCoAppearanceRanking();

    expect(result.found).toBe(true);
    expect(result.totalContentCount).toBe(3);

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
      ownParents: {
        video_casts: ["v1"],
        live_casts: [],
        radio_casts: [],
        article_casts: [],
        tv_show_casts: [],
        topic_casts: [],
      },
      coCasts: {
        video_casts: [
          {
            video_id: "v1",
            artist_id: null,
            comedy_group_id: DONDECORTE_ID,
            unit_id: null,
            artist: null,
            comedy_group: { id: DONDECORTE_ID, name: "ドンデコルテ" },
            unit: null,
          },
        ],
      },
    });

    const result = await getCoAppearanceRanking();
    expect(result.combos).toEqual([]);
    expect(result.artists).toEqual([]);
    expect(result.units).toEqual([]);
  });
});
