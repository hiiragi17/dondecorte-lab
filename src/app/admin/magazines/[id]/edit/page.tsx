import Link from "next/link";
import { notFound } from "next/navigation";
import { MagazineForm } from "@/components/features/magazine/magazine-form";
import { MemoSection } from "@/components/features/memo/memo-section";
import { updateMagazine } from "@/lib/actions/magazines";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { getMagazine } from "@/lib/queries/magazines";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditMagazinePage({ params }: Props) {
  const { id } = await params;
  const [magazine, artists, combos, units] = await Promise.all([
    getMagazine(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!magazine) {
    notFound();
  }

  const action = updateMagazine.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/magazines"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 雑誌一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {magazine.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <MagazineForm
          key={magazine.id}
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={magazine}
          initialCasts={magazine.casts}
          submitLabel="更新する"
        />
      </div>

      <MemoSection targetType="magazine" targetId={magazine.id} variant="admin" />
    </div>
  );
}
