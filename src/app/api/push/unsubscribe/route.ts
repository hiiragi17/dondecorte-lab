import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type UnsubscribeBody = {
  endpoint?: unknown;
};

// endpoint 指定で購読を削除する。
export async function POST(request: Request) {
  let body: UnsubscribeBody;
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

  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint が指定されていません" },
      { status: 400 }
    );
  }

  const { error } = await adminClient
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json(
      { error: "購読の解除に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
