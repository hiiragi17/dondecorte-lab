import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { syncAllChannels } from "@/lib/integrations/youtube/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 文字列を一定時間で比較する（長さの違いも含めてタイミング攻撃を避ける）。
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Vercel Cron は CRON_SECRET 設定時に `Authorization: Bearer <CRON_SECRET>` を自動付与する。
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // 秘密が未設定なら、誰でも叩ける状態を避けるため一律で拒否する。
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  return safeEqual(header, `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllChannels();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
