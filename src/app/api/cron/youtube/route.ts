import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { syncAllChannels } from "@/lib/integrations/youtube/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllChannels();

    // 登録チャンネルがあるのに全件失敗した場合（例: YOUTUBE_API_KEY 不正や
    // YouTube API 障害）は 200/ok:true を返すと Vercel Cron が成功扱いになり、
    // 取り込み停止が検知できなくなる。全滅時は 500 で失敗として表面化させる。
    const allFailed =
      summary.channels > 0 && summary.outcomes.every((o) => !o.ok);

    return NextResponse.json(
      { ok: !allFailed, ...summary },
      { status: allFailed ? 500 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
