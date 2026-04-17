import Link from "next/link";
import { notFound } from "next/navigation";
import { ComboForm } from "@/components/features/combo/combo-form";
import { updateCombo } from "@/lib/actions/combos";
import { listArtistSummaries } from "@/lib/queries/artists";
import { getCombo } from "@/lib/queries/combos";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditComboPage({ params }: Props) {
  const { id } = await params;
  const [combo, artists] = await Promise.all([
    getCombo(id),
    listArtistSummaries(),
  ]);
  if (!combo) {
    notFound();
  }

  const action = updateCombo.bind(null, id);
  const initialMembers = combo.members.map((m) => ({
    artist_id: m.artist_id,
    artist_name: m.artist.name,
    artist_kana: m.artist.kana_name,
    role: m.role,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/combos"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← コンビ一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {combo.name} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <ComboForm
          action={action}
          artists={artists}
          initialValues={combo}
          initialMembers={initialMembers}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
