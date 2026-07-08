// FANY チケット一覧ページ（ticket.fany.lol）の HTML パーサ（#97 / #42）。
//
// テキスト抽出ヘルパ（parsePerformanceDate / parseReceptionPeriod / classifyReception /
// parseStatus / *IdFrom）は構造が安定しているため単体テスト済み。
// parseSearchResults の CSS セレクタ（[SELECTOR]）とページング / フィルタのクエリ（[PARAM]）は
// 実 HTML を devtools で確認して差し替える。抽出ヘルパはそのまま使い回せる設計。

import * as cheerio from "cheerio";
import { BASE, TARGET } from "./client";
import type {
  DiffResult,
  FanyEvent,
  Reception,
  ReceptionKind,
  ReceptionStatus,
} from "./types";

// "2026/07/29(水)" + 開場 / 開演 を Date / 時刻に。JST 固定で組み立て、サーバの TZ に依存させない。
export function parsePerformanceDate(
  text: string
): Pick<FanyEvent, "performanceDate" | "openTime" | "startTime"> {
  const d = text.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  const open = text.match(/開場\s*(\d{1,2}:\d{2})/);
  const start = text.match(/開演\s*(\d{1,2}:\d{2})/);
  const startTime = start?.[1] ?? null;
  let performanceDate: Date | null = null;
  if (d) {
    const [hh, mm] = (startTime ?? "00:00").split(":");
    performanceDate = new Date(
      `${d[1]}-${d[2]}-${d[3]}T${hh.padStart(2, "0")}:${mm}:00+09:00`
    );
  }
  return { performanceDate, openTime: open?.[1] ?? null, startTime };
}

// "受付期間： 2026/05/09(土) 20:30～2026/05/12(火) 11:00" → { start, end }。
export function parseReceptionPeriod(text: string): {
  acceptStart: Date | null;
  acceptEnd: Date | null;
} {
  const re = /(\d{4})\/(\d{2})\/(\d{2})\([^)]*\)\s*(\d{1,2}:\d{2})/g;
  const hits = [...text.matchAll(re)];
  const toDate = (m: RegExpMatchArray) =>
    new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4].padStart(5, "0")}:00+09:00`);
  return {
    acceptStart: hits[0] ? toDate(hits[0]) : null,
    acceptEnd: hits[1] ? toDate(hits[1]) : null,
  };
}

// 受付行のラベルから種別 / 属性を分類。
export function classifyReception(
  name: string
): Pick<Reception, "kind" | "isPresale" | "isPremium" | "round"> {
  const isPremium =
    /^●/.test(name.trim()) || name.includes("プレミアムメンバー");
  const isPresale = name.includes("先行");
  let kind: ReceptionKind = "不明";
  if (name.includes("抽選")) kind = "抽選";
  else if (name.includes("先着")) kind = "先着";
  else if (name.includes("一般")) kind = "一般";
  let round: number | null = null;
  if (name.includes("一次")) round = 1;
  else if (name.includes("二次")) round = 2;
  else if (name.includes("三次")) round = 3;
  return { kind, isPresale, isPremium, round };
}

export function parseStatus(text: string): ReceptionStatus {
  if (text.includes("受付前")) return "受付前";
  if (text.includes("受付中")) return "受付中";
  if (text.includes("受付終了")) return "受付終了";
  if (text.includes("発売中")) return "発売中";
  return "不明";
}

export const receptionIdFrom = (href: string): number | null => {
  const m =
    href.match(/\/reception\/(\d+)\/\d+/) ||
    href.match(/\/limited\/reception\/(\d+)/);
  return m ? Number(m[1]) : null;
};

export const eventIdFrom = (href: string): number | null => {
  const m =
    href.match(/\/event\/detail\/(\d+)/) ||
    href.match(/\/reception\/\d+\/(\d+)/);
  return m ? Number(m[1]) : null;
};

// 一覧ページのパース。
// NOTE: $card / 受付行のセレクタは実 HTML を devtools で確認して差し替える（[SELECTOR]）。
//       構造（公演日・出演・受付リンク群）自体は確認済みなので、上の抽出ヘルパはそのまま使える。
export function parseSearchResults(html: string): FanyEvent[] {
  const $ = cheerio.load(html);
  const events: FanyEvent[] = [];

  // TODO[SELECTOR]: 実際のカード要素セレクタに置換
  $("[data-event-card], .event-card, li.result").each((_, el) => {
    const $card = $(el);
    const cardText = $card.text().replace(/\s+/g, " ").trim();

    // 出演者: "出演" 見出し以降のテキストを ／ 、 で分割
    const castRaw =
      $card.find(".cast, [data-cast]").text() ||
      (cardText.split("出演")[1] ?? "");
    const cast = castRaw
      .split(/[／/、,]/)
      .map((s) => s.replace(/\[.*?\]|MC[:：]|ゲスト[:：]/g, "").trim())
      .filter(Boolean);

    const { performanceDate, openTime, startTime } =
      parsePerformanceDate(cardText);

    const receptions: Reception[] = [];
    $card.find("a[href*='/reception/']").each((__, a) => {
      const href = $(a).attr("href") ?? "";
      const line = $(a).text().replace(/\s+/g, " ").trim();
      const receptionId = receptionIdFrom(href);
      if (receptionId == null) return;
      const nameOnly = line.replace(/受付期間.*/, "").trim();
      receptions.push({
        receptionId,
        ...classifyReception(nameOnly),
        name: nameOnly,
        ...parseReceptionPeriod(line),
        status: parseStatus($card.text()),
        url: href.startsWith("http") ? href : BASE + href,
      });
    });

    const firstHref = $card.find("a[href*='/reception/']").attr("href") ?? "";
    const eventId = eventIdFrom(firstHref) ?? -1;

    events.push({
      eventId,
      title: $card.find(".title, h3, h4").first().text().trim(),
      performanceDate,
      openTime,
      startTime,
      venue: $card.find(".venue").text().trim(),
      prefecture:
        (cardText.match(/（([^）]+?[都道府県])）/) ?? [])[1] ?? null,
      cast,
      detailUrl: eventId > 0 ? `${BASE}/event/detail/${eventId}` : "",
      receptions,
      hasTarget:
        cast.some((c) => c.includes(TARGET)) || cardText.includes(TARGET),
    });
  });

  return events;
}

// #97 / #42 の検知ロジック（差分）。
// dedup / 主キー: (eventId, receptionId)。同名公演でも公演回ごとに eventId が別なので
// eventId 粒度で足りる。
export function diff(
  fetched: FanyEvent[],
  knownEventIds: Set<number>,
  knownReceptionIds: Set<number>
): DiffResult {
  const target = fetched.filter((e) => e.hasTarget);
  const newEvents = target.filter((e) => !knownEventIds.has(e.eventId));
  const upcomingPresales = target
    .flatMap((e) => e.receptions)
    .filter(
      (r) =>
        r.isPresale &&
        !knownReceptionIds.has(r.receptionId) &&
        (r.status === "受付前" || r.status === "受付中")
    );
  return { newEvents, upcomingPresales };
}
