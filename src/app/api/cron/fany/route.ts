import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { syncFany } from "@/lib/integrations/fany/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FANY 自動取り込みのマスタースイッチ。既定（未設定）では無効。
// 実 HTML でのパース検証と migration 012 の適用が済むまで、cron が発火しても
// FANY 取得・DB 書き込みをいっさい行わず no-op で返す。
// 有効化するときは Vercel の環境変数に FANY_SYNC_ENABLED=true を設定する（コード変更不要）。
function isFanySyncEnabled(): boolean {
  return process.env.FANY_SYNC_ENABLED === "true";
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // まだ有効化していない間は取得も DB 書き込みもせず no-op で返す。
  if (!isFanySyncEnabled()) {
    return NextResponse.json({ ok: true, disabled: true }, { status: 200 });
  }

  try {
    const summary = await syncFany();
    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
