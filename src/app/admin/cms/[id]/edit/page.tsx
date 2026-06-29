import Link from "next/link";
import { notFound } from "next/navigation";
import { CmForm } from "@/components/features/cm/cm-form";
import { MemoSection } from "@/components/features/memo/memo-section";
import { updateCm } from "@/lib/actions/cms";
import { listArtistSummaries } from "@/lib/queries/artists";
import { getCm } from "@/lib/queries/cms";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCmPage({ params }: Props) {
  const { id } = await params;
  const [cm, artists, combos, units] = await Promise.all([
    getCm(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!cm) {
    notFound();
  }

  const action = updateCm.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/cms"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← CM一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {cm.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <CmForm
          key={cm.id}
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={cm}
          initialCasts={cm.casts}
          submitLabel="更新する"
        />
      </div>

      <MemoSection targetType="cm" targetId={cm.id} variant="admin" />
    </div>
  );
}
