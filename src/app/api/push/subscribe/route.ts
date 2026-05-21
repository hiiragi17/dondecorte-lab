import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionJSON } from "@/lib/types/push";

export const runtime = "nodejs";

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_P256DH_LENGTH = 512;
const MAX_AUTH_LENGTH = 256;

// 未認証で叩ける書き込み口なので、保存できない / 送信不能なレコードが
// 永続化されないよう厳しめに検証する（空キーや非 HTTPS endpoint を弾く）。
function isValidSubscription(value: unknown): value is PushSubscriptionJSON {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.endpoint !== "string" ||
    v.endpoint.length === 0 ||
    v.endpoint.length > MAX_ENDPOINT_LENGTH
  ) {
    return false;
  }
  try {
    if (new URL(v.endpoint).protocol !== "https:") return false;
  } catch {
    return false;
  }

  if (typeof v.keys !== "object" || v.keys === null) return false;
  const keys = v.keys as Record<string, unknown>;
  return (
    typeof keys.p256dh === "string" &&
    keys.p256dh.length > 0 &&
    keys.p256dh.length <= MAX_P256DH_LENGTH &&
    typeof keys.auth === "string" &&
    keys.auth.length > 0 &&
    keys.auth.length <= MAX_AUTH_LENGTH
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (!isValidSubscription(body)) {
    return NextResponse.json({ error: "購読情報が不正です" }, { status: 400 });
  }

  const { error } = await adminClient.from("push_subscriptions").upsert(
    {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: request.headers.get("user-agent"),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json(
      { error: "購読の登録に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
