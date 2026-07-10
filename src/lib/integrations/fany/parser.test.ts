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
import type { FanyEvent, Reception, ReceptionStatus } from "./types";

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
    ["販売終了", "受付終了"],
    ["売切", "受付終了"],
    ["発売前", "発売前"],
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

// parseSearchResults は devtools 確認済みのクラス名（fany_performanceListBox 系 /
// fany_g-ticketInfo 系）に沿った合成フィクスチャで配線を回帰確認する。
describe("parseSearchResults (合成フィクスチャ)", () => {
  const html = `
    <div class="fany_performanceListBox">
      <h4 class="fany_performanceListBox__header">
        <span class="fany_performanceListBox__headerDate">2026/07/29(水) 開場19:00 開演19:30</span>
        <span class="fany_performanceListBox__headerTitle">ドンデコルテ単独ライブ</span>
        <span class="fany_performanceListBox__headerVenue">ヨシモト∞ホール（東京都）</span>
      </h4>
      <div class="fany_performanceListBox__stageInfo">
        <p class="preview_block">ドンデコルテ／マユリカ</p>
      </div>
      <div class="fany_g-ticketInfo fany_g-ticket_lottery">
        <ul class="fany_icon__lottery"><li>抽選先行 受付前</li></ul>
        <div class="fany_g-ticketInfo__text">●FANY IDプレミアムメンバー一次抽選先行 受付期間： 2026/05/09(土) 20:30～2026/05/12(火) 11:00</div>
        <a href="/reception/123/456">申込</a>
      </div>
    </div>`;

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

// diff 用の最小ファクトリ。
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

function rec(receptionId: number, status: ReceptionStatus): Reception {
  return {
    receptionId,
    kind: "抽選",
    isPresale: true,
    isPremium: false,
    round: null,
    name: "受付",
    acceptStart: null,
    acceptEnd: null,
    status,
    url: "",
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

  it("新規受付を 受付前/発売前=scheduleReminder、受付中/発売中=notifyNow に振り分ける", () => {
    const fetched = [
      makeEvent({
        eventId: 10,
        receptions: [
          rec(100, "受付前"), // → scheduleReminder
          rec(101, "発売前"), // → scheduleReminder
          rec(102, "受付中"), // → notifyNow
          rec(103, "発売中"), // → notifyNow
          rec(104, "受付終了"), // → どちらにも入らない
        ],
      }),
    ];
    const r = diff(fetched, new Set([10]), new Set());
    expect(r.scheduleReminder.map((x) => x.receptionId)).toEqual([100, 101]);
    expect(r.notifyNow.map((x) => x.receptionId)).toEqual([102, 103]);
  });

  it("既知の receptionId は scheduleReminder / notifyNow から除外する", () => {
    const fetched = [
      makeEvent({
        eventId: 20,
        receptions: [rec(200, "受付前"), rec(201, "受付中")],
      }),
    ];
    const r = diff(fetched, new Set([20]), new Set([200, 201]));
    expect(r.scheduleReminder).toEqual([]);
    expect(r.notifyNow).toEqual([]);
  });
});
