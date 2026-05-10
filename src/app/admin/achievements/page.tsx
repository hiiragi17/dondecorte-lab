import Link from "next/link";
import { AchievementDeleteButton } from "@/components/features/achievement/achievement-delete-button";
import { deleteAchievement } from "@/lib/actions/achievements";
import { listAchievements } from "@/lib/queries/achievements";
import type { AchievementWithTarget } from "@/lib/types/achievement";

export const dynamic = "force-dynamic";

function targetName(
  achievement: Pick<AchievementWithTarget, "artist" | "comedy_group" | "unit">
): string {
  return (
    achievement.comedy_group?.name ??
    achievement.artist?.name ??
    achievement.unit?.name ??
    "—"
  );
}

export default async function AdminAchievementsPage() {
  const achievements = await listAchievements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">受賞歴</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            M-1, KOC, R-1 等の大会実績を管理します。
          </p>
        </div>
        <Link
          href="/admin/achievements/new"
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {achievements.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだ受賞歴が登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">年</th>
                <th className="px-4 py-2 text-left font-medium">大会名</th>
                <th className="px-4 py-2 text-left font-medium">結果</th>
                <th className="px-4 py-2 text-left font-medium">対象</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {achievements.map((achievement) => (
                <tr key={achievement.id} className="hover:bg-brand-bg-light">
                  <td className="px-4 py-2 text-brand-brown-light">
                    {achievement.year}
                  </td>
                  <td className="px-4 py-2 font-medium text-brand-brown-dark">
                    {achievement.title}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {achievement.result}
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {targetName(achievement)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/achievements/${achievement.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteAchievement}>
                        <input type="hidden" name="id" value={achievement.id} />
                        <AchievementDeleteButton title={achievement.title} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
