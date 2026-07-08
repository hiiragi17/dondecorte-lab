import { describe, it, expect } from "vitest";
import {
  classifyReception,
  diff,
  eventIdFrom,
  parsePerformanceDate,
  parseReceptionPeriod,
  parseSearchResults,
  parseStatus,
  receptionIdFrom,
} from "./parser";
import type { FanyEvent } from "./types";

describe("parsePerformanceDate", () => {
  it("公演日と開場 / 開演を JST で組み立てる", () => {
    const r = parsePerformanceDate("2026/07/29(水) 開場19:00 開演19:30");
    expect(r.openTime).toBe("19:00");
    expect(r.startTime).toBe("19:30");
    // JST 19:30 = UTC 10:30。サーバ TZ に依存しないことを ISO で確認
    expect(r.performanceDate?.toISOString()).toBe("2026-07-29T10:30:00.000Z");
  });

  it("開演がなければ 00:00 として日付だけ組み立てる", () => {
    const r = parsePerformanceDate("2026/07/29(水) 会場未定");
    expect(r.startTime).toBeNull();
    expect(r.performanceDate?.toISOString()).toBe("2026-07-28T15:00:00.000Z");
  });

  it("日付がなければ null", () => {
    const r = parsePerformanceDate("日程調整中");
    expect(r.performanceDate).toBeNull();
  });
});

describe("parseReceptionPeriod", () => {
  it("受付開始と締切を抽出する", () => {
    const r = parseReceptionPeriod(
      "受付期間： 2026/05/09(土) 20:30～2026/05/12(火) 11:00"
    );
    expect(r.acceptStart?.toISOString()).toBe("2026-05-09T11:30:00.000Z");
    expect(r.acceptEnd?.toISOString()).toBe("2026-05-12T02:00:00.000Z");
  });

  it("1 桁時刻もゼロ埋めして解釈する", () => {
    const r = parseReceptionPeriod("2026/05/09(土) 9:05～2026/05/12(火) 11:00");
    expect(r.acceptStart?.toISOString()).toBe("2026-05-09T00:05:00.000Z");
  });

  it("日時が無ければ null", () => {
    const r = parseReceptionPeriod("受付期間：未定");
    expect(r.acceptStart).toBeNull();
    expect(r.acceptEnd).toBeNull();
  });
});

describe("classifyReception", () => {
  it("プレミアム一次抽選先行を分類する", () => {
    const r = classifyReception("●FANY IDプレミアムメンバー一次抽選先行");
    expect(r).toEqual({
      kind: "抽選",
      isPresale: true,
      isPremium: true,
      round: 1,
    });
  });

  it("先着二次先行を分類する", () => {
    const r = classifyReception("二次先着先行");
    expect(r).toEqual({
      kind: "先着",
      isPresale: true,
      isPremium: false,
      round: 2,
    });
  });

  it("一般発売は先行でも抽選でもない", () => {
    const r = classifyReception("一般発売");
    expect(r).toEqual({
      kind: "一般",
      isPresale: false,
      isPremium: false,
      round: null,
    });
  });
});

describe("parseStatus", () => {
  it.each([
    ["受付前です", "受付前"],
    ["ただいま受付中", "受付中"],
    ["受付終了しました", "受付終了"],
    ["発売中", "発売中"],
    ["情報なし", "不明"],
  ])("%s → %s", (input, expected) => {
    expect(parseStatus(input)).toBe(expected);
  });
});

describe("receptionIdFrom / eventIdFrom", () => {
  it("通常の reception URL から両 ID を取る", () => {
    expect(receptionIdFrom("/reception/123/456")).toBe(123);
    expect(eventIdFrom("/reception/123/456")).toBe(456);
  });

  it("limited reception URL から reception ID を取る", () => {
    expect(receptionIdFrom("/limited/reception/789")).toBe(789);
  });

  it("event detail URL から event ID を取る", () => {
    expect(eventIdFrom("/event/detail/999")).toBe(999);
  });

  it("該当しない URL は null", () => {
    expect(receptionIdFrom("/search/event")).toBeNull();
    expect(eventIdFrom("/search/event")).toBeNull();
  });
});

// parseSearchResults は実 HTML のセレクタ確定前のため、想定構造に沿った合成フィクスチャで
// 配線（出演者 / 受付行 / hasTarget の抽出）を回帰確認する。実 HTML 確定時にフィクスチャを差し替える。
describe("parseSearchResults (合成フィクスチャ)", () => {
  const html = `
    <ul>
      <li class="result">
        <h3 class="title">ドンデコルテ単独ライブ</h3>
        <div class="venue">ヨシモト∞ホール</div>
        <p>2026/07/29(水) 開場19:00 開演19:30 （東京都） 受付前</p>
        <div class="cast">ドンデコルテ／マユリカ</div>
        <a href="/reception/123/456">●FANY IDプレミアムメンバー一次抽選先行 受付期間： 2026/05/09(土) 20:30～2026/05/12(火) 11:00</a>
      </li>
    </ul>`;

  it("イベントと受付を抽出する", () => {
    const events = parseSearchResults(html);
    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.title).toBe("ドンデコルテ単独ライブ");
    expect(e.venue).toBe("ヨシモト∞ホール");
    expect(e.prefecture).toBe("東京都");
    expect(e.cast).toEqual(["ドンデコルテ", "マユリカ"]);
    expect(e.hasTarget).toBe(true);
    expect(e.performanceDate?.toISOString()).toBe("2026-07-29T10:30:00.000Z");
    expect(e.detailUrl).toBe("https://ticket.fany.lol/event/detail/456");

    expect(e.receptions).toHaveLength(1);
    const r = e.receptions[0];
    expect(r.receptionId).toBe(123);
    expect(r.kind).toBe("抽選");
    expect(r.isPresale).toBe(true);
    expect(r.isPremium).toBe(true);
    expect(r.round).toBe(1);
    expect(r.status).toBe("受付前");
    expect(r.acceptStart?.toISOString()).toBe("2026-05-09T11:30:00.000Z");
    expect(r.url).toBe("https://ticket.fany.lol/reception/123/456");
  });

  it("該当カードが無ければ空配列", () => {
    expect(parseSearchResults("<div>no cards</div>")).toEqual([]);
  });
});

// diff 用の最小イベントファクトリ。
function makeEvent(overrides: Partial<FanyEvent>): FanyEvent {
  return {
    eventId: 1,
    title: "t",
    performanceDate: null,
    openTime: null,
    startTime: null,
    venue: "",
    prefecture: null,
    cast: [],
    detailUrl: "",
    receptions: [],
    hasTarget: true,
    ...overrides,
  };
}

describe("diff", () => {
  it("未知の対象イベントを新規として返す", () => {
    const fetched = [
      makeEvent({ eventId: 1 }),
      makeEvent({ eventId: 2 }),
      makeEvent({ eventId: 3, hasTarget: false }), // 対象外は除外
    ];
    const r = diff(fetched, new Set([1]), new Set());
    expect(r.newEvents.map((e) => e.eventId)).toEqual([2]);
  });

  it("受付前 / 受付中の未知の先行だけ upcomingPresales に入れる", () => {
    const fetched = [
      makeEvent({
        eventId: 10,
        receptions: [
          {
            receptionId: 100,
            kind: "抽選",
            isPresale: true,
            isPremium: false,
            round: 1,
            name: "一次抽選先行",
            acceptStart: null,
            acceptEnd: null,
            status: "受付前",
            url: "",
          },
          {
            receptionId: 101,
            kind: "一般",
            isPresale: false, // 先行でない → 除外
            isPremium: false,
            round: null,
            name: "一般発売",
            acceptStart: null,
            acceptEnd: null,
            status: "受付中",
            url: "",
          },
          {
            receptionId: 102,
            kind: "抽選",
            isPresale: true,
            isPremium: false,
            round: 2,
            name: "二次抽選先行",
            acceptStart: null,
            acceptEnd: null,
            status: "受付終了", // 終了 → 除外
            url: "",
          },
        ],
      }),
    ];
    const r = diff(fetched, new Set([10]), new Set([999]));
    expect(r.upcomingPresales.map((x) => x.receptionId)).toEqual([100]);
  });

  it("既知の先行 ID は除外する", () => {
    const fetched = [
      makeEvent({
        eventId: 20,
        receptions: [
          {
            receptionId: 200,
            kind: "抽選",
            isPresale: true,
            isPremium: false,
            round: 1,
            name: "一次抽選先行",
            acceptStart: null,
            acceptEnd: null,
            status: "受付中",
            url: "",
          },
        ],
      }),
    ];
    const r = diff(fetched, new Set([20]), new Set([200]));
    expect(r.upcomingPresales).toEqual([]);
  });
});
