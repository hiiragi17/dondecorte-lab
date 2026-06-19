import { describe, expect, it } from "vitest";
import { parseCasts } from "./casts";

function buildFormData(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

describe("parseCasts", () => {
  it("cast フィールドが無ければ空配列を返す", () => {
    expect(parseCasts(new FormData())).toEqual({ casts: [] });
  });

  it("type / id を CastEntry に変換する", () => {
    const fd = buildFormData({
      cast_type: ["artist", "comedy_group"],
      cast_id: ["a1", "g1"],
      cast_name: ["渡辺銀次", "ドンデコルテ"],
    });
    expect(parseCasts(fd)).toEqual({
      casts: [
        { type: "artist", id: "a1", name: "渡辺銀次" },
        { type: "comedy_group", id: "g1", name: "ドンデコルテ" },
      ],
    });
  });

  it("type か id が欠ける行はスキップする", () => {
    const fd = buildFormData({
      cast_type: ["artist", ""],
      cast_id: ["a1", "a2"],
      cast_name: ["A", "B"],
    });
    expect(parseCasts(fd)).toEqual({
      casts: [{ type: "artist", id: "a1", name: "A" }],
    });
  });

  it("不正な種別はエラーを返す", () => {
    const fd = buildFormData({
      cast_type: ["invalid"],
      cast_id: ["a1"],
      cast_name: ["A"],
    });
    expect(parseCasts(fd)).toEqual({
      casts: [],
      error: "出演者の種別が不正です",
    });
  });

  it("同一出演者の重複はエラーを返す", () => {
    const fd = buildFormData({
      cast_type: ["artist", "artist"],
      cast_id: ["a1", "a1"],
      cast_name: ["A", "A"],
    });
    expect(parseCasts(fd)).toEqual({
      casts: [],
      error: "同じ出演者を複数回追加できません",
    });
  });
});
