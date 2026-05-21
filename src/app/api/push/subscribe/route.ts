import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionJSON } from "@/lib/types/push";

export const runtime = "nodejs";

function isValidSubscription(value: unknown): value is PushSubscriptionJSON {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.endpoint !== "string" || v.endpoint.length === 0) return false;
  if (typeof v.keys !== "object" || v.keys === null) return false;
  const keys = v.keys as Record<string, unknown>;
  return typeof keys.p256dh === "string" && typeof keys.auth === "string";
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
