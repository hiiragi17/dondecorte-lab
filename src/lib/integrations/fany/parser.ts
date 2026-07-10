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
  if (
    text.includes("受付終了") ||
    text.includes("販売終了") ||
    text.includes("売切")
  )
    return "受付終了";
  if (text.includes("発売前")) return "発売前"; // 「発売中」より先に判定
  if (text.includes("発売中")) return "発売中";
  return "不明";
}

// 事前予告できる状態か（受付前 / 発売前）。突発販売（いきなり受付中 / 発売中）と区別する。
export function isAdvanceNotice(s: ReceptionStatus): boolean {
  return s === "受付前" || s === "発売前";
}

// いま購入アクション可能な状態か。
export function isLive(s: ReceptionStatus): boolean {
  return s === "受付中" || s === "発売中";
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

// 一覧ページのパース。セレクタは devtools 実 HTML で確認済み（fany_performanceListBox 系 /
// fany_g-ticketInfo 系）。
//   カード       : .fany_performanceListBox
//   ヘッダ(h4)   : .fany_performanceListBox__header      （日時 + タイトル + 会場）
//   タイトル     : .fany_performanceListBox__headerTitle
//   会場         : .fany_performanceListBox__headerVenue （「会場：」は ::before なので text は会場名のみ）
//   本体         : .fany_performanceListBox__stageInfo
//   出演者       : p.preview_block
//   受付ブロック : .fany_g-ticketInfo                    （抽選は .fany_g-ticket_lottery を併せ持つ）
//   ステータス   : ul[class*="fany_icon__"] > li
//   受付リンク   : a[href*="/reception/"]                （/reception/{receptionId}/{eventId}）
//   名称+期間    : .fany_g-ticketInfo__text
export function parseSearchResults(html: string): FanyEvent[] {
  const $ = cheerio.load(html);
  const events: FanyEvent[] = [];

  $(".fany_performanceListBox").each((_, el) => {
    const $card = $(el);
    const $header = $card.find(".fany_performanceListBox__header").first();

    // 日時: ヘッダ内テキストに公演日 + 開場 / 開演がある（受付期間は stageInfo 側なので混ざらない）。
    const { performanceDate, openTime, startTime } = parsePerformanceDate(
      $header.text()
    );

    // 会場: 「会場：」は CSS ::before 生成なので text は会場名のみ。末尾の（都道府県）を分離する。
    const venueRaw = $card
      .find(".fany_performanceListBox__headerVenue")
      .text()
      .trim();
    const prefecture =
      (venueRaw.match(/（([^）]+?[都道府県])）\s*$/) ?? [])[1] ?? null;
    const venue = venueRaw.replace(/（[^）]+）\s*$/, "").trim();

    // 出演者: preview_block を ／ 、 で分割。[..]見出し・〈..〉・MC:・ゲスト: を除去。
    const cast = $card
      .find(".fany_performanceListBox__stageInfo p.preview_block")
      .text()
      .replace(/\[[^\]]*\]|〈[^〉]*〉|MC[:：]|ゲスト[:：]/g, "")
      .split(/[／/、,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // 受付ブロック: .fany_g-ticketInfo ごとに 1 レコード。
    const receptions: Reception[] = [];
    $card.find(".fany_g-ticketInfo").each((__, block) => {
      const $b = $(block);
      const href = $b.find('a[href*="/reception/"]').attr("href") ?? "";
      const receptionId = receptionIdFrom(href);
      if (receptionId == null) return;

      const text = $b.find(".fany_g-ticketInfo__text").text() || $b.text();
      const name = text.replace(/受付期間[：:][\s\S]*/, "").trim();
      const cls = classifyReception(name);
      // クラスで抽選を確定（テキストより堅牢）。
      if ($b.hasClass("fany_g-ticket_lottery")) cls.kind = "抽選";

      receptions.push({
        receptionId,
        ...cls,
        name,
        ...parseReceptionPeriod(text),
        status: parseStatus(
          $b.find('[class*="fany_icon__"]').text() || $b.text()
        ),
        url: href.startsWith("http") ? href : BASE + href,
      });
    });

    const eventId =
      eventIdFrom($card.find('a[href*="/reception/"]').attr("href") ?? "") ?? -1;
    const title = $card
      .find(".fany_performanceListBox__headerTitle")
      .text()
      .trim();

    events.push({
      eventId,
      title,
      performanceDate,
      openTime,
      startTime,
      venue,
      prefecture,
      cast,
      detailUrl: eventId > 0 ? `${BASE}/event/detail/${eventId}` : "",
      receptions,
      hasTarget:
        cast.some((c) => c.includes(TARGET)) ||
        $card.find("p.preview_block").text().includes(TARGET) ||
        title.includes(TARGET),
    });
  });

  return events;
}

// #97 / #42 の検知ロジック（差分）。dedup 主キー: (eventId, receptionId)。同名公演でも
// 公演回ごとに eventId が別なので eventId 粒度で足りる。先行 / 先着を問わず「新規に現れた受付」を
// 拾い、事前予告できる状態（受付前 / 発売前）と突発販売（いきなり受付中 / 発売中）に振り分ける。
export function diff(
  fetched: FanyEvent[],
  knownEventIds: Set<number>,
  knownReceptionIds: Set<number>
): DiffResult {
  const target = fetched.filter((e) => e.hasTarget);
  const newEvents = target.filter((e) => !knownEventIds.has(e.eventId));

  const newReceptions = target
    .flatMap((e) => e.receptions)
    .filter((r) => !knownReceptionIds.has(r.receptionId));

  return {
    newEvents,
    scheduleReminder: newReceptions.filter((r) => isAdvanceNotice(r.status)),
    notifyNow: newReceptions.filter((r) => isLive(r.status)),
  };
}
