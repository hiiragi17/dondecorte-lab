import Link from "next/link";
import { notFound } from "next/navigation";
import { AchievementForm } from "@/components/features/achievement/achievement-form";
import { updateAchievement } from "@/lib/actions/achievements";
import { getAchievement } from "@/lib/queries/achievements";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAchievementPage({ params }: Props) {
  const { id } = await params;
  const [achievement, artists, combos, units] = await Promise.all([
    getAchievement(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!achievement) {
    notFound();
  }

  const action = updateAchievement.bind(null, id);

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
          受賞歴を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <AchievementForm
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={achievement}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
