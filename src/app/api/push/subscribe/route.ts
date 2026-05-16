import { NextResponse } from "next/server";
import { isAllowedPushEndpoint } from "@/lib/push/endpoint";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SubscribeBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

// PushSubscription を upsert する。ログイン不要で誰でも自分の端末を登録できる。
export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const endpoint =
    typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh =
    typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "subscription の形式が不正です" },
      { status: 400 }
    );
  }

  // SSRF 対策: 主要ブラウザのプッシュサービス以外の endpoint は登録させない。
  if (!isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json(
      { error: "サポートされていないプッシュサービスです" },
      { status: 400 }
    );
  }

  const { error } = await adminClient.from("push_subscriptions").upsert(
    {
      endpoint,
      p256dh,
      auth,
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
