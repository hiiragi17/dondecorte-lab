import { describe, expect, it } from "vitest";
import { aggregateAppearanceRanking } from "@/lib/queries/rankings";
import type { CastEntry, ContentType } from "@/lib/types";

const dondecorte: CastEntry = {
  type: "comedy_group",
  id: "g1",
  name: "ドンデコルテ",
};
const ginji: CastEntry = { type: "artist", id: "a1", name: "渡辺銀次" };
const kyosaku: CastEntry = { type: "artist", id: "a2", name: "小橋共作" };
const aoi: CastEntry = { type: "artist", id: "x1", name: "あおい" };
const kaede: CastEntry = { type: "artist", id: "x2", name: "かえで" };

function castsByContentType(
  partial: Partial<Record<ContentType, CastEntry[]>>
): Record<ContentType, CastEntry[]> {
  return {
    video: [],
    live: [],
    radio: [],
    article: [],
    tv_show: [],
    topic: [],
    ...partial,
  };
}

describe("aggregateAppearanceRanking", () => {
  it("counts appearances per content type and computes totals", () => {
    const result = aggregateAppearanceRanking(
      castsByContentType({
        video: [dondecorte, dondecorte, ginji],
        live: [dondecorte],
        topic: [ginji],
      })
    );

    const group = result.find((e) => e.performer.id === "g1");
    expect(group?.counts.video).toBe(2);
    expect(group?.counts.live).toBe(1);
    expect(group?.counts.radio).toBe(0);
    expect(group?.total).toBe(3);

    const artist = result.find((e) => e.performer.id === "a1");
    expect(artist?.counts.video).toBe(1);
    expect(artist?.counts.topic).toBe(1);
    expect(artist?.total).toBe(2);
  });

  it("sorts entries by total count descending", () => {
    const result = aggregateAppearanceRanking(
      castsByContentType({
        video: [dondecorte, dondecorte, kyosaku],
        live: [dondecorte, kyosaku, ginji],
      })
    );

    expect(result.map((e) => e.performer.id)).toEqual(["g1", "a2", "a1"]);
  });

  it("breaks ties by performer name", () => {
    const result = aggregateAppearanceRanking(
      castsByContentType({ video: [kaede, aoi] })
    );

    expect(result.map((e) => e.performer.id)).toEqual(["x1", "x2"]);
  });

  it("returns an empty array when there are no casts", () => {
    expect(aggregateAppearanceRanking(castsByContentType({}))).toEqual([]);
  });
});
