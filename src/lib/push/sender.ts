import "server-only";
import {
  sendNotification,
  setVapidDetails,
  WebPushError,
  type PushSubscription as WebPushSubscription,
} from "web-push";
import { adminClient } from "@/lib/supabase/admin";
import type { PushPayload, PushSubscriptionRow } from "@/lib/types/push";

let vapidConfigured = false;

function configureVapid(): void {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID 環境変数（VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT）が未設定です"
    );
  }
  setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

type SubscriptionLike = Pick<PushSubscriptionRow, "endpoint" | "p256dh" | "auth">;

// 失効した endpoint（404/410）は GC して二度と送らない。
// 削除に失敗した場合は throw し、呼び出し側で「送信失敗」として扱う
// （stale 行が残ったまま removed に計上されると以後のブロードキャストで毎回失敗するため）。
async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await adminClient
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) {
    throw new Error(`失効した購読端末の削除に失敗しました: ${error.message}`);
  }
}

// 単一端末への送信。成功で true、endpoint 失効で削除して false、それ以外は throw。
export async function sendPush(
  subscription: SubscriptionLike,
  payload: PushPayload
): Promise<boolean> {
  configureVapid();

  const target: WebPushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  };

  try {
    await sendNotification(target, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (
      err instanceof WebPushError &&
      (err.statusCode === 404 || err.statusCode === 410)
    ) {
      await deleteSubscription(subscription.endpoint);
      return false;
    }
    throw err;
  }
}

export type SendPushSummary = {
  sent: number;
  removed: number;
  failed: number;
};

// 全購読端末へ送信。失効端末は GC、その他の失敗は握りつぶしてカウントだけ返す。
export async function sendPushToAll(
  payload: PushPayload
): Promise<SendPushSummary> {
  configureVapid();

  const { data, error } = await adminClient
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) {
    throw new Error(`購読端末の取得に失敗しました: ${error.message}`);
  }

  const subscriptions = data ?? [];
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPush(sub, payload))
  );

  const summary: SendPushSummary = { sent: 0, removed: 0, failed: 0 };
  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value) summary.sent += 1;
      else summary.removed += 1;
    } else {
      summary.failed += 1;
    }
  }
  return summary;
}
