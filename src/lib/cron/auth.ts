import { timingSafeEqual } from "node:crypto";

// 文字列を一定時間で比較する（長さの違いも含めてタイミング攻撃を避ける）。
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Vercel Cron は CRON_SECRET 設定時に `Authorization: Bearer <CRON_SECRET>` を自動付与する。
// 秘密が未設定なら、誰でも叩ける状態を避けるため一律で拒否する。
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  return safeEqual(header, `Bearer ${secret}`);
}
