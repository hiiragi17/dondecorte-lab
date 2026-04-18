import Link from "next/link";
import { AchievementForm } from "@/components/features/achievement/achievement-form";
import { createAchievement } from "@/lib/actions/achievements";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewAchievementPage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/achievements"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 受賞歴一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          受賞歴を新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <AchievementForm
          action={createAchievement}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
