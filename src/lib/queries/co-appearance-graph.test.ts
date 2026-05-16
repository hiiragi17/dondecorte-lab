import { describe, expect, it, vi, beforeEach } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

import { getCoAppearanceGraph } from "./co-appearance-graph";

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

function ddRow(parentField: string, parentId: string): AnyRow {
  return {
    [parentField]: parentId,
    artist_id: null,
    comedy_group_id: DONDECORTE_ID,
    unit_id: null,
    artist: null,
    comedy_group: { id: DONDECORTE_ID, name: "ドンデコルテ" },
    unit: null,
  };
}

function comboRow(
  parentField: string,
  parentId: string,
  id: string,
  name: string
): AnyRow {
  return {
    [parentField]: parentId,
    artist_id: null,
    comedy_group_id: id,
    unit_id: null,
    artist: null,
    comedy_group: { id, name },
    unit: null,
  };
}

function artistRow(
  parentField: string,
  parentId: string,
  id: string,
  name: string
): AnyRow {
  return {
    [parentField]: parentId,
    artist_id: id,
    comedy_group_id: null,
    unit_id: null,
    artist: { id, name },
    comedy_group: null,
    unit: null,
  };
}

function unitRow(
  parentField: string,
  parentId: string,
  id: string,
  name: string
): AnyRow {
  return {
    [parentField]: parentId,
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

describe("getCoAppearanceGraph", () => {
  it("ドンデコルテが見つからない場合は found=false を返す", async () => {
    buildQueryStub({ ownParents: {}, coCasts: {}, dondecorteId: null });

    const result = await getCoAppearanceGraph();
    expect(result.found).toBe(false);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it("共演データからノードとエッジを生成する", async () => {
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
          ddRow("video_id", "v1"),
          comboRow("video_id", "v1", "combo-a", "コンビA"),
          ddRow("video_id", "v2"),
          comboRow("video_id", "v2", "combo-a", "コンビA"),
          artistRow("video_id", "v2", "artist-x", "芸人X"),
        ],
        live_casts: [
          ddRow("live_id", "l1"),
          comboRow("live_id", "l1", "combo-b", "コンビB"),
          unitRow("live_id", "l1", "unit-1", "ユニット1"),
        ],
      },
    });

    const result = await getCoAppearanceGraph();

    expect(result.found).toBe(true);
    expect(result.totalContentCount).toBe(3);

    const center = result.nodes.find((node) => node.isCenter);
    expect(center?.id).toBe(`comedy_group:${DONDECORTE_ID}`);
    expect(center?.count).toBe(3);

    expect(result.nodes).toHaveLength(5);
    const comboA = result.nodes.find((node) => node.id === "comedy_group:combo-a");
    expect(comboA?.count).toBe(2);
    const artistX = result.nodes.find((node) => node.id === "artist:artist-x");
    expect(artistX?.count).toBe(1);

    const weightOf = (a: string, b: string) => {
      const [source, target] = [a, b].sort();
      return result.links.find(
        (link) => link.source === source && link.target === target
      )?.weight;
    };

    expect(result.links).toHaveLength(6);
    expect(weightOf(`comedy_group:${DONDECORTE_ID}`, "comedy_group:combo-a")).toBe(
      2
    );
    expect(weightOf("comedy_group:combo-a", "artist:artist-x")).toBe(1);
    expect(weightOf("comedy_group:combo-b", "unit:unit-1")).toBe(1);
  });

  it("共演者がいない場合は中心ノードのみを返す", async () => {
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
        video_casts: [ddRow("video_id", "v1")],
      },
    });

    const result = await getCoAppearanceGraph();
    expect(result.found).toBe(true);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].isCenter).toBe(true);
    expect(result.links).toEqual([]);
  });
});
