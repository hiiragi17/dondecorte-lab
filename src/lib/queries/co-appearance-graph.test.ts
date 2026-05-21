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

function ddRow(contentType: string, contentId: string): AnyRow {
  return {
    content_type: contentType,
    content_id: contentId,
    artist_id: null,
    comedy_group_id: DONDECORTE_ID,
    unit_id: null,
    artist: null,
    comedy_group: { id: DONDECORTE_ID, name: "ドンデコルテ" },
    unit: null,
  };
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

describe("getCoAppearanceGraph", () => {
  it("ドンデコルテが見つからない場合は found=false を返す", async () => {
    buildQueryStub({ ownContents: [], coCasts: [], dondecorteId: null });

    const result = await getCoAppearanceGraph();
    expect(result.found).toBe(false);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it("共演データからノードとエッジを生成する", async () => {
    buildQueryStub({
      ownContents: [
        { content_type: "video", content_id: "v1" },
        { content_type: "video", content_id: "v2" },
        { content_type: "live", content_id: "l1" },
      ],
      coCasts: [
        ddRow("video", "v1"),
        comboRow("video", "v1", "combo-a", "コンビA"),
        ddRow("video", "v2"),
        comboRow("video", "v2", "combo-a", "コンビA"),
        artistRow("video", "v2", "artist-x", "芸人X"),
        ddRow("live", "l1"),
        comboRow("live", "l1", "combo-b", "コンビB"),
        unitRow("live", "l1", "unit-1", "ユニット1"),
      ],
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
      ownContents: [{ content_type: "video", content_id: "v1" }],
      coCasts: [ddRow("video", "v1")],
    });

    const result = await getCoAppearanceGraph();
    expect(result.found).toBe(true);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].isCenter).toBe(true);
    expect(result.links).toEqual([]);
  });
});
