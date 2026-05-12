import { describe, expect, it } from "vitest";
import { extractYoutubeVideoId, YOUTUBE_ID_PATTERN } from "./youtube";

describe("extractYoutubeVideoId", () => {
  it("watch?v= 形式の URL から ID を抽出する", () => {
    expect(
      extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("youtu.be 短縮 URL から ID を抽出する", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("m.youtube.com / www サブドメインに対応する", () => {
    expect(
      extractYoutubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("/embed/, /shorts/, /v/ 形式から ID を抽出する", () => {
    expect(
      extractYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
    expect(
      extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
    expect(
      extractYoutubeVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("前後の空白をトリミングする", () => {
    expect(
      extractYoutubeVideoId("  https://youtu.be/dQw4w9WgXcQ  ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("watch URL に追加クエリがあっても ID を抽出する", () => {
    expect(
      extractYoutubeVideoId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123"
      )
    ).toBe("dQw4w9WgXcQ");
  });

  it("不正な URL に対して null を返す", () => {
    expect(extractYoutubeVideoId("invalid-url")).toBeNull();
    expect(extractYoutubeVideoId("")).toBeNull();
  });

  it("YouTube 以外のホストに対して null を返す", () => {
    expect(
      extractYoutubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")
    ).toBeNull();
  });

  it("ID の長さが 11 文字でなければ null を返す", () => {
    expect(
      extractYoutubeVideoId("https://www.youtube.com/watch?v=short")
    ).toBeNull();
    expect(extractYoutubeVideoId("https://youtu.be/tooooolong12")).toBeNull();
  });

  it("watch URL に v パラメータがない場合 null を返す", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch")).toBeNull();
  });
});

describe("YOUTUBE_ID_PATTERN", () => {
  it("11 文字の英数字・ハイフン・アンダースコアにマッチする", () => {
    expect(YOUTUBE_ID_PATTERN.test("dQw4w9WgXcQ")).toBe(true);
    expect(YOUTUBE_ID_PATTERN.test("abc_-1234XY")).toBe(true);
  });

  it("11 文字でない場合はマッチしない", () => {
    expect(YOUTUBE_ID_PATTERN.test("short")).toBe(false);
    expect(YOUTUBE_ID_PATTERN.test("dQw4w9WgXcQ_extra")).toBe(false);
  });

  it("使用不可文字を含む場合はマッチしない", () => {
    expect(YOUTUBE_ID_PATTERN.test("dQw4w9WgXc!")).toBe(false);
  });
});
