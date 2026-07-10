import { describe, it, expect, vi } from "vitest";

// syncFany 本体は adminClient / push を叩くため、ここでは import 副作用を抑えて
// 純粋なマッピング関数（JST 丸め・timestamp 保持・phase 変換）を検証する。
vi.mock("@/lib/supabase/admin", () => ({ adminClient: { from: vi.fn() } }));
vi.mock("@/lib/push/sender", () => ({ sendPushToAll: vi.fn() }));

import {
  SOURCE,
  selectLiveSaleExternalIds,
  toJstDate,
  toLiveRow,
  toScheduleRow,
} from "./sync";
import type { FanyEvent, Reception } from "./types";

function makeEvent(overrides: Partial<FanyEvent> = {}): FanyEvent {
  return {
    eventId: 456,
    title: "ドンデコルテ単独ライブ",
    performanceDate: new Date("2026-07-29T10:30:00Z"), // JST 19:30
    openTime: "19:00",
    startTime: "19:30",
    venue: "ヨシモト∞ホール",
    prefecture: "東京都",
    cast: ["ドンデコルテ"],
    detailUrl: "https://ticket.fany.lol/event/detail/456",
    receptions: [],
    hasTarget: true,
    ...overrides,
  };
}

function makeReception(overrides: Partial<Reception> = {}): Reception {
  return {
    receptionId: 123,
    kind: "抽選",
    isPresale: true,
    isPremium: true,
    round: 1,
    name: "一次抽選先行",
    acceptStart: new Date("2026-05-09T11:30:00Z"), // JST 20:30
    acceptEnd: new Date("2026-05-12T02:00:00Z"), // JST 11:00
    status: "受付前",
    url: "https://ticket.fany.lol/reception/123/456",
    ...overrides,
  };
}

describe("toJstDate", () => {
  it("UTC の instant を JST の暦日に丸める", () => {
    expect(toJstDate(new Date("2026-05-12T02:00:00Z"))).toBe("2026-05-12");
  });

  it("UTC では前日でも JST では翌日になる境界を正しく扱う", () => {
    // 2026-05-11 15:30Z = JST 2026-05-12 00:30
    expect(toJstDate(new Date("2026-05-11T15:30:00Z"))).toBe("2026-05-12");
  });
});

describe("toLiveRow", () => {
  it("FanyEvent を lives の行に変換する", () => {
    const row = toLiveRow(makeEvent());
    expect(row).toEqual({
      title: "ドンデコルテ単独ライブ",
      event_date: "2026-07-29",
      start_time: "2026-07-29T10:30:00.000Z",
      venue: "ヨシモト∞ホール",
      url: "https://ticket.fany.lol/event/detail/456",
      source: SOURCE,
      external_id: "456",
      source_url: "https://ticket.fany.lol/event/detail/456",
    });
  });

  it("公演日が無ければ event_date / start_time は null", () => {
    const row = toLiveRow(makeEvent({ performanceDate: null }));
    expect(row.event_date).toBeNull();
    expect(row.start_time).toBeNull();
  });

  it("開演時刻が無ければ event_date は残すが start_time は null（架空の 0 時を残さない）", () => {
    const row = toLiveRow(makeEvent({ startTime: null }));
    expect(row.event_date).toBe("2026-07-29");
    expect(row.start_time).toBeNull();
  });
});

describe("toScheduleRow", () => {
  it("抽選受付を lottery + date + timestamp で変換する", () => {
    const row = toScheduleRow(makeReception(), "live-uuid", 0);
    expect(row).toEqual({
      live_id: "live-uuid",
      phase_type: "lottery",
      label: "一次抽選先行",
      start_date: "2026-05-09",
      end_date: "2026-05-12",
      starts_at: "2026-05-09T11:30:00.000Z",
      ends_at: "2026-05-12T02:00:00.000Z",
      url: "https://ticket.fany.lol/reception/123/456",
      source: SOURCE,
      external_id: "123",
      sort_order: 0,
    });
  });

  it("一般 / 先着は sale に振り分ける", () => {
    expect(toScheduleRow(makeReception({ kind: "一般" }), "l", 1).phase_type).toBe(
      "sale"
    );
    expect(toScheduleRow(makeReception({ kind: "先着" }), "l", 2).phase_type).toBe(
      "sale"
    );
  });

  it("締切が無ければ end_date / ends_at は null", () => {
    const row = toScheduleRow(makeReception({ acceptEnd: null }), "l", 0);
    expect(row.end_date).toBeNull();
    expect(row.ends_at).toBeNull();
  });
});

describe("selectLiveSaleExternalIds", () => {
  it("先行以外でいま受付中 / 発売中の受付だけを external_id で返す", () => {
    const event = makeEvent({
      receptions: [
        // 先行（受付中）→ notifyNewSchedules 担当なので除外
        makeReception({ receptionId: 1, isPresale: true, status: "受付中" }),
        // 先着・発売中 → 対象
        makeReception({
          receptionId: 2,
          isPresale: false,
          kind: "先着",
          status: "発売中",
        }),
        // 一般・受付中 → 対象
        makeReception({
          receptionId: 3,
          isPresale: false,
          kind: "一般",
          status: "受付中",
        }),
        // 先着・発売前（未開始）→ 事前予告はカレンダー委譲なので除外
        makeReception({
          receptionId: 4,
          isPresale: false,
          kind: "先着",
          status: "発売前",
        }),
        // 締切済み → 除外
        makeReception({
          receptionId: 5,
          isPresale: false,
          status: "受付終了",
        }),
        // 無名（label = null 相当）の先着・発売中 → label に依存せず対象
        makeReception({
          receptionId: 6,
          isPresale: false,
          kind: "先着",
          name: "",
          status: "発売中",
        }),
      ],
    });
    expect(selectLiveSaleExternalIds([event])).toEqual(["2", "3", "6"]);
  });

  it("対象が無ければ空配列", () => {
    const event = makeEvent({
      receptions: [makeReception({ isPresale: true, status: "受付前" })],
    });
    expect(selectLiveSaleExternalIds([event])).toEqual([]);
  });
});
