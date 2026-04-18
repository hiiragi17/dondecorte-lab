import Link from "next/link";
import { notFound } from "next/navigation";
import { RadioForm } from "@/components/features/radio/radio-form";
import { updateRadio } from "@/lib/actions/radios";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import { getRadio } from "@/lib/queries/radios";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRadioPage({ params }: Props) {
  const { id } = await params;
  const [radio, artists, combos, units] = await Promise.all([
    getRadio(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!radio) {
    notFound();
  }

  const action = updateRadio.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/radios"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← ラジオ一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {radio.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <RadioForm
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={radio}
          initialCasts={radio.casts}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
