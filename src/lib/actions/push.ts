"use server";

import { sendPushToAll, type SendPushSummary } from "@/lib/push/sender";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils/site-url";

export type TestPushResult =
  | { ok: true; summary: SendPushSummary }
  | { ok: false; error: string };

export async function sendTestPush(): Promise<TestPushResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "認証が必要です" };

  try {
    const summary = await sendPushToAll({
      title: "DonDecorte Lab",
      body: "テスト通知です。これが表示されていれば通知設定は完了です。",
      url: getSiteUrl(),
      tag: "test",
    });
    return { ok: true, summary };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "テスト通知の送信に失敗しました",
    };
  }
}
