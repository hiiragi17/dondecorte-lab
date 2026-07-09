import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { syncFany } from "@/lib/integrations/fany/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncFany();
    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
