"use server";

import { revalidatePath } from "next/cache";
import { broadcastPush } from "@/lib/push/sender";
import { createClient } from "@/lib/supabase/server";
import type { PushBroadcastResult } from "@/lib/types/push";

export type TestPushState = {
  error?: string;
  result?: PushBroadcastResult;
};

// 管理画面からテスト通知を全購読端末へ送信する。
export async function sendTestPush(): Promise<TestPushState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  try {
    const result = await broadcastPush({
      title: "DonDecorte Lab",
      body: "テスト通知です。これが届いていれば通知設定は完了しています。",
      url: "/",
      tag: "test",
    });
    revalidatePath("/admin/notifications");
    return { result };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "通知の送信に失敗しました",
    };
  }
}
