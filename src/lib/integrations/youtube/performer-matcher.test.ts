import { describe, it, expect } from "vitest";
import {
  matchPerformers,
  normalizeForMatch,
  type PerformerCandidate,
} from "./performer-matcher";

const candidates: PerformerCandidate[] = [
  { type: "comedy_group", id: "g1", name: "ドンデコルテ", aliases: ["どんでこるて"] },
  { type: "artist", id: "a1", name: "渡辺銀次", aliases: ["わたなべぎんじ"] },
  { type: "artist", id: "a2", name: "小橋共作", aliases: ["こばしきょうさく"] },
  { type: "unit", id: "u1", name: "ダウ90000" },
];

describe("normalizeForMatch", () => {
  it("全角/半角・大小・区切り記号を吸収する", () => {
    expect(normalizeForMatch("小橋 共作")).toBe("小橋共作");
    expect(normalizeForMatch("小橋・共作")).toBe("小橋共作");
    expect(normalizeForMatch("ＡＢＣ")).toBe("abc");
    expect(normalizeForMatch("M-1")).toBe("m1");
  });
});

describe("matchPerformers", () => {
  it("タイトルに正式名が含まれる出演者を推定する", () => {
    const result = matchPerformers(
      "【コント】ドンデコルテ 新作コント",
      candidates
    );
    expect(result).toEqual([
      { type: "comedy_group", id: "g1", name: "ドンデコルテ" },
    ]);
  });

  it("複数の出演者を候補順に返す", () => {
    const result = matchPerformers(
      "渡辺銀次と小橋共作のフリートーク",
      candidates
    );
    expect(result.map((c) => c.id)).toEqual(["a1", "a2"]);
  });

  it("区切り記号・空白があっても照合できる", () => {
    const result = matchPerformers("小橋　共作 ソロ回", candidates);
    expect(result.map((c) => c.id)).toEqual(["a2"]);
  });

  it("かな表記（別表記）でも照合できる", () => {
    const result = matchPerformers("わたなべぎんじ 密着", candidates);
    expect(result.map((c) => c.id)).toEqual(["a1"]);
  });

  it("該当なしなら空配列を返す", () => {
    expect(matchPerformers("ゲスト無しの雑談回", candidates)).toEqual([]);
  });

  it("空テキストなら空配列を返す", () => {
    expect(matchPerformers("", candidates)).toEqual([]);
    expect(matchPerformers("   ", candidates)).toEqual([]);
  });

  it("同一候補は重複排除する", () => {
    const dup: PerformerCandidate[] = [
      { type: "artist", id: "a1", name: "渡辺銀次" },
      { type: "artist", id: "a1", name: "渡辺銀次" },
    ];
    const result = matchPerformers("渡辺銀次 登場", dup);
    expect(result).toHaveLength(1);
  });

  it("1文字の名前は誤検出防止のため照合対象から除外する", () => {
    const shortName: PerformerCandidate[] = [
      { type: "artist", id: "x", name: "西" },
    ];
    expect(matchPerformers("西へ向かう旅の話", shortName)).toEqual([]);
  });

  it("別表記が空/nullでも正式名で照合できる", () => {
    const result = matchPerformers("ダウ90000 とのコラボ", candidates);
    expect(result.map((c) => c.id)).toEqual(["u1"]);
  });
});
