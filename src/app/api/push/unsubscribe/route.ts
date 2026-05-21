import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const endpoint =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).endpoint
      : null;
  if (typeof endpoint !== "string" || endpoint.length === 0) {
    return NextResponse.json({ error: "endpoint が不正です" }, { status: 400 });
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
