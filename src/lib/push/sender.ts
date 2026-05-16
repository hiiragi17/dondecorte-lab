import "server-only";
import webpush from "web-push";
import { isAllowedPushEndpoint } from "@/lib/push/endpoint";
import { adminClient } from "@/lib/supabase/admin";
import type {
  PushBroadcastResult,
  PushPayload,
  PushSubscriptionRow,
} from "@/lib/types/push";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID 環境変数（NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT）が設定されていません"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export type SendPushResult =
  | { ok: true }
  | { ok: false; gone: boolean; error: string };

// 1端末へプッシュ送信する。404/410（endpoint 失効）が返ったら自動で行を削除する。
export async function sendPush(
  subscription: PushSubscriptionRow,
  payload: PushPayload
): Promise<SendPushResult> {
  // SSRF 対策: 未知のホスト宛にサーバから送信させない（endpoint.ts の解説参照）。
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    return {
      ok: false,
      gone: false,
      error: "許可されていないプッシュサービスの endpoint です",
    };
  }

  configureVapid();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const gone = statusCode === 404 || statusCode === 410;

    if (gone) {
      const { error: deleteError } = await adminClient
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);

      // 削除に失敗した場合は行が残るため removed として数えない。
      if (deleteError) {
        return {
          ok: false,
          gone: false,
          error: `失効した endpoint の削除に失敗しました: ${deleteError.message}`,
        };
      }
    }

    return {
      ok: false,
      gone,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// 全購読端末へプッシュ送信する。失効した endpoint は sendPush 内で GC される。
export async function broadcastPush(
  payload: PushPayload
): Promise<PushBroadcastResult> {
  configureVapid();

  const { data, error } = await adminClient
    .from("push_subscriptions")
    .select("*");

  if (error) {
    throw new Error(`購読端末一覧の取得に失敗しました: ${error.message}`);
  }

  const subscriptions = (data ?? []) as PushSubscriptionRow[];
  const results = await Promise.all(
    subscriptions.map((sub) => sendPush(sub, payload))
  );

  const result: PushBroadcastResult = { sent: 0, failed: 0, removed: 0 };
  for (const r of results) {
    if (r.ok) {
      result.sent += 1;
    } else {
      result.failed += 1;
      if (r.gone) result.removed += 1;
    }
  }
  return result;
}
