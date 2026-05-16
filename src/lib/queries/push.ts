import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionListItem } from "@/lib/types/push";

// 管理画面用。RLS により anon からは読めないため service_role 経由で取得する。
// p256dh / auth は機微情報のため取得せず、表示に必要な列だけを射影する。
export async function listPushSubscriptions(): Promise<
  PushSubscriptionListItem[]
> {
  const { data, error } = await adminClient
    .from("push_subscriptions")
    .select("id, user_agent, created_at, last_seen_at")
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(`購読端末一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as PushSubscriptionListItem[];
}
