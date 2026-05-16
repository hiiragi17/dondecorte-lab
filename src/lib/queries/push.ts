import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionRow } from "@/lib/types/push";

// 管理画面用。RLS により anon からは読めないため service_role 経由で取得する。
export async function listPushSubscriptions(): Promise<PushSubscriptionRow[]> {
  const { data, error } = await adminClient
    .from("push_subscriptions")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(`購読端末一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as PushSubscriptionRow[];
}
