// FANY チケット（ticket.fany.lol）から取得するライブ / 受付情報の型（#97 / #42）。
// 対象は公開の事実データ（公演日 / 会場 / 出演者 / 受付期間）のみ。説明文の丸ごと保存はしない。

export type ReceptionKind = "抽選" | "先着" | "一般" | "不明";
export type ReceptionStatus = "受付前" | "受付中" | "受付終了" | "発売中" | "不明";

export interface Reception {
  receptionId: number; // /reception/{recId}/{eventId} または /limited/reception/{recId}
  kind: ReceptionKind; // 抽選先行 / 先着 / 一般
  isPresale: boolean; // 「先行」を含むか（#97 の主対象）
  isPremium: boolean; // 先頭 "●" = FANY ID プレミアムメンバー
  round: number | null; // 一次=1, 二次=2 …
  name: string; // 例: "FANY IDプレミアムメンバー一次抽選先行"
  acceptStart: Date | null;
  acceptEnd: Date | null;
  status: ReceptionStatus;
  url: string;
}

export interface FanyEvent {
  eventId: number; // /event/detail/{eventId}
  title: string;
  performanceDate: Date | null; // 公演日（開演）。開場は別途保持してもよい
  openTime: string | null; // "19:00"
  startTime: string | null; // "19:30"
  venue: string;
  prefecture: string | null; // "東京都"
  cast: string[];
  detailUrl: string;
  receptions: Reception[];
  hasTarget: boolean; // cast に TARGET を含むか
}

// #97（発見）/ #42（先行）の検知結果。
export interface DiffResult {
  newEvents: FanyEvent[]; // → #42 発見 push
  upcomingPresales: Reception[]; // → #97 先行 push（受付前 & acceptStart が近い）
}
