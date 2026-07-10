import { adminClient } from "@/lib/supabase/admin";
import { sendPushToAll } from "@/lib/push/sender";
import { discoveryUrl, fetchPolite } from "./client";
import { parseSearchResults } from "./parser";
import type { FanyEvent, Reception } from "./types";

// 取得元識別子。lives.source / live_schedules.source に入れて手動入力分と区別する。
export const SOURCE = "fany";

// Date（instant）を JST の暦日 YYYY-MM-DD に変換する。
// live_schedules は date 粒度（010 の「時刻を持たない」設計）を維持するため、
// 受付の開始 / 締切時刻はこの関数で JST 日付に丸めて保存する。
export function toJstDate(d: Date): string {
  // en-CA は YYYY-MM-DD 形式で返す。
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

// FanyEvent → lives の 1 行。external_id で重複排除するため eventId が必須。
// lives.title は NOT NULL なのでタイトル無しは呼び出し側で除外する。
export function toLiveRow(event: FanyEvent) {
  return {
    title: event.title,
    event_date: event.performanceDate ? toJstDate(event.performanceDate) : null,
    // start_time は timestamptz。開演時刻が無い場合 parser は 00:00 で埋めるため、
    // 実際の開演時刻（startTime）がある時だけ保存し、無ければ null（架空の 0 時を残さない）。
    start_time:
      event.performanceDate && event.startTime
        ? event.performanceDate.toISOString()
        : null,
    venue: event.venue || null,
    url: event.detailUrl || null,
    source: SOURCE,
    external_id: String(event.eventId),
    source_url: event.detailUrl || null,
  };
}

// Reception → live_schedules の 1 行。start_date は NOT NULL なので
// acceptStart 無しは呼び出し側で除外する。抽選 → lottery、それ以外 → sale。
// start_date / end_date は帯表示用の date、starts_at / ends_at は時刻付きの instant。
export function toScheduleRow(
  reception: Reception,
  liveId: string,
  sortOrder: number
) {
  return {
    live_id: liveId,
    phase_type: reception.kind === "抽選" ? "lottery" : "sale",
    label: reception.name || null,
    start_date: reception.acceptStart
      ? toJstDate(reception.acceptStart)
      : null,
    end_date: reception.acceptEnd ? toJstDate(reception.acceptEnd) : null,
    starts_at: reception.acceptStart ? reception.acceptStart.toISOString() : null,
    ends_at: reception.acceptEnd ? reception.acceptEnd.toISOString() : null,
    url: reception.url || null,
    source: SOURCE,
    external_id: String(reception.receptionId),
    sort_order: sortOrder,
  };
}

// 取得結果のうち DB に保存できるイベントだけを残す。
// - eventId が正（reception リンクから解決できている）
// - タイトルがある（lives.title は NOT NULL）
function isPersistableEvent(event: FanyEvent): boolean {
  return event.eventId > 0 && event.title.trim().length > 0;
}

export type FanySyncResult = {
  notModified: boolean; // 304（前回から変化なし）で早期リターンしたか
  fetched: number; // パースできたイベント総数
  targetEvents: number; // ドンデコルテ出演として保存対象になった数
  newLives: number; // 今回新規挿入された lives
  newSchedules: number; // 今回新規挿入された live_schedules
  pushed: number; // 発見 push を送った行数（lives + live_schedules）
};

// FANY 検索ページを 1 回取得し、ドンデコルテ出演ライブ / 受付を lives・live_schedules に
// upsert して、新規行に発見 push を送る（#97 / #42）。
//
// NOTE: parseSearchResults の CSS セレクタ（[SELECTOR]）が実 HTML に未対応の段階では
//       target が 0 件になり、全ステップが安全に no-op で通り抜ける（=「動く枠」）。
export async function syncFany(etag?: string): Promise<FanySyncResult> {
  const empty: FanySyncResult = {
    notModified: false,
    fetched: 0,
    targetEvents: 0,
    newLives: 0,
    newSchedules: 0,
    pushed: 0,
  };

  // 発見用 URL（先行受付前 / 受付中 + 先着発売前 / 発売中の 4 フィルタ）。
  // 「先行経由」も「いきなり先着 / 一般の突発販売」も両方拾える。
  const res = await fetchPolite(discoveryUrl(), { etag });
  if (res.status === 304) {
    return { ...empty, notModified: true };
  }

  const events = parseSearchResults(res.html);
  const target = events.filter((e) => e.hasTarget && isPersistableEvent(e));
  if (target.length === 0) {
    return { ...empty, fetched: events.length };
  }

  // 1. lives を upsert（未登録のみ挿入）。inserted 行だけが返る。
  const newLives = await upsertLives(target);

  // 2. 対象イベントの lives.id を external_id で解決（新規・既存問わず受付を紐付ける）。
  const liveIdByExternal = await resolveLiveIds(target);

  // 3. live_schedules を upsert（未登録のみ挿入）。
  const newSchedules = await upsertSchedules(target, liveIdByExternal);

  // 4. 未通知の新規 lives / live_schedules に発見 push を送る。
  const pushed = await notifyNewLives();
  const pushedSchedules = await notifyNewSchedules();

  return {
    notModified: false,
    fetched: events.length,
    targetEvents: target.length,
    newLives,
    newSchedules,
    pushed: pushed + pushedSchedules,
  };
}

// 対象イベントを lives に upsert し、新規挿入された行数を返す。
async function upsertLives(target: FanyEvent[]): Promise<number> {
  const { data, error } = await adminClient
    .from("lives")
    .upsert(target.map(toLiveRow), {
      onConflict: "source,external_id",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) {
    throw new Error(`ライブの保存に失敗しました: ${error.message}`);
  }
  return (data ?? []).length;
}

// 対象イベントの external_id → lives.id を引く。
async function resolveLiveIds(
  target: FanyEvent[]
): Promise<Map<string, string>> {
  const externalIds = target.map((e) => String(e.eventId));
  const { data, error } = await adminClient
    .from("lives")
    .select("id, external_id")
    .eq("source", SOURCE)
    .in("external_id", externalIds);
  if (error) {
    throw new Error(`ライブ ID の解決に失敗しました: ${error.message}`);
  }
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.external_id) map.set(row.external_id, row.id);
  }
  return map;
}

// 対象イベントの受付を live_schedules に upsert し、新規挿入された行数を返す。
async function upsertSchedules(
  target: FanyEvent[],
  liveIdByExternal: Map<string, string>
): Promise<number> {
  const rows: ReturnType<typeof toScheduleRow>[] = [];
  for (const event of target) {
    const liveId = liveIdByExternal.get(String(event.eventId));
    if (!liveId) continue; // lives 解決に失敗した受付はスキップ
    event.receptions.forEach((reception, index) => {
      // start_date は NOT NULL。開始日が取れない受付は保存しない。
      if (!reception.acceptStart) return;
      rows.push(toScheduleRow(reception, liveId, index));
    });
  }
  if (rows.length === 0) return 0;

  const { data, error } = await adminClient
    .from("live_schedules")
    .upsert(rows, {
      onConflict: "source,external_id",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) {
    throw new Error(`受付スケジュールの保存に失敗しました: ${error.message}`);
  }
  return (data ?? []).length;
}

// 未通知（notified_new_at IS NULL）の FANY 由来 lives を単一 UPDATE ... RETURNING で
// 原子的にクレームし、発見 push を送る。多重クロン実行での二重送信を防ぐ。
// push がバッチ全体で失敗した場合はクレームを戻し、次回リトライできるようにする。
async function notifyNewLives(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await adminClient
    .from("lives")
    .update({ notified_new_at: now })
    .eq("source", SOURCE)
    .is("notified_new_at", null)
    .select("id, title");
  if (error) {
    throw new Error(`新規ライブのクレームに失敗しました: ${error.message}`);
  }
  const claimed = data ?? [];
  if (claimed.length === 0) return 0;

  // 送信済みの行はクレームを維持し、失敗した行と未送信の残りだけ戻す
  // （全戻しにすると、次回実行で送信済みのぶんまで二重 push してしまう）。
  for (let i = 0; i < claimed.length; i++) {
    try {
      await sendPushToAll({
        title: "新しいライブが追加されました",
        body: claimed[i].title ?? "ドンデコルテの新しいライブ情報",
        url: `/lives/${claimed[i].id}`,
        tag: `live-${claimed[i].id}`,
      });
    } catch (error) {
      await adminClient
        .from("lives")
        .update({ notified_new_at: null })
        .in(
          "id",
          claimed.slice(i).map((r) => r.id)
        );
      throw error;
    }
  }
  return claimed.length;
}

// 未通知の FANY 由来 live_schedules の「先行受付」だけに発見 push を送る。lives と同じクレーム方式。
// - label が「先行」を含む行だけに絞る（classifyReception の isPresale = name.includes("先行") と
//   同じ判定。label = 受付名）。一般発売など先行以外は保存はされるが push はされない。
// - 既に締切済み（ends_at が過去）の受付は発見しても通知価値がないため除外する。ends_at が
//   null（締切不明）は受付中の可能性があるため対象に残す。受付前 / 受付中のみ通知する狙い。
async function notifyNewSchedules(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await adminClient
    .from("live_schedules")
    .update({ notified_new_at: now })
    .eq("source", SOURCE)
    .is("notified_new_at", null)
    .ilike("label", "%先行%")
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .select("id, label, live_id");
  if (error) {
    throw new Error(`新規受付のクレームに失敗しました: ${error.message}`);
  }
  const claimed = data ?? [];
  if (claimed.length === 0) return 0;

  // lives と同様、送信済みの行はクレームを維持し、失敗行と未送信の残りだけ戻す。
  for (let i = 0; i < claimed.length; i++) {
    try {
      await sendPushToAll({
        title: "先行受付が告知されました",
        body: claimed[i].label ?? "ドンデコルテのライブ先行受付",
        url: `/lives/${claimed[i].live_id}`,
        tag: `schedule-${claimed[i].id}`,
      });
    } catch (error) {
      await adminClient
        .from("live_schedules")
        .update({ notified_new_at: null })
        .in(
          "id",
          claimed.slice(i).map((r) => r.id)
        );
      throw error;
    }
  }
  return claimed.length;
}
